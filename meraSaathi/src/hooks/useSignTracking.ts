import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { SignType } from '../data/signLevels';

// Helper: Calculates the true 3D Euclidean distance between two hand landmarks
const getDistance = (p1: any, p2: any) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
};

export function useSignTracking(videoRef: React.RefObject<HTMLVideoElement>, targetSign: SignType) {
  const [isSignDetected, setIsSignDetected] = useState(false);
  const [isHandVisible, setIsHandVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);

  // Keep target sign fresh without triggering hook re-runs
  const targetSignRef = useRef<SignType>(targetSign);
  useEffect(() => {
    targetSignRef.current = targetSign;
  }, [targetSign]);

  useEffect(() => {
    let active = true;

    async function initMediaPipe() {
      try {
        // Hardcoding stable version to prevent CDN cache misses
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU" // CPU is 100% stable across all web browsers and perfectly fast enough for 1 hand.
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        
        if (active) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch (e) {
        console.error("MediaPipe failed to load. Check your network or CDN.", e);
      }
    }
    
    initMediaPipe();

    return () => {
      active = false;
      if (landmarkerRef.current) landmarkerRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isReady || !videoRef.current) return;
    const video = videoRef.current;
    
    const detectHand = () => {
      // CRITICAL FIX: Only process if video is actively playing and has real dimensions
      if (video.readyState >= 2 && video.videoWidth > 0 && landmarkerRef.current) {
        
        // MediaPipe requires the timestamp to strictly increase
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          
          try {
            const results = landmarkerRef.current.detectForVideo(video, performance.now());
            
            if (results.landmarks && results.landmarks.length > 0) {
              setIsHandVisible(true);
              const landmarks = results.landmarks[0];
              const wrist = landmarks[0];
              
              // FLAWLESS 3D HEURISTIC: Compare distance from WRIST to TIP vs WRIST to PIP (knuckle).
              // If tip is further from the wrist than the knuckle, the finger is UP.
              const iUp = getDistance(wrist, landmarks[8]) > getDistance(wrist, landmarks[6]);
              const mUp = getDistance(wrist, landmarks[12]) > getDistance(wrist, landmarks[10]);
              const rUp = getDistance(wrist, landmarks[16]) > getDistance(wrist, landmarks[14]);
              const pUp = getDistance(wrist, landmarks[20]) > getDistance(wrist, landmarks[18]);
              
              // Thumb is special. Check Tip vs MCP joint.
              const tUp = getDistance(wrist, landmarks[4]) > getDistance(wrist, landmarks[2]);

              let matched = false;

              // Strict boolean matching for the 10 target signs
              switch (targetSignRef.current) {
                case 'one': matched = iUp && !mUp && !rUp && !pUp; break;
                case 'peace': matched = iUp && mUp && !rUp && !pUp; break;
                case 'water': matched = iUp && mUp && rUp && !pUp; break;
                case 'highfive': matched = iUp && mUp && rUp && pUp && tUp; break;
                case 'rock': matched = !iUp && !mUp && !rUp && !pUp && !tUp; break;
                case 'ice': matched = !iUp && !mUp && !rUp && pUp; break;
                case 'love': matched = iUp && !mUp && !rUp && pUp && tUp; break;
                case 'fox': matched = !iUp && mUp && rUp && pUp; break;
                case 'spider': matched = iUp && mUp && !rUp && pUp; break;
                case 'super': matched = !iUp && !mUp && !rUp && !pUp && tUp; break;
                default: matched = false;
              }

              setIsSignDetected(matched);
            } else {
              setIsHandVisible(false);
              setIsSignDetected(false); 
            }
          } catch (err) {
            console.error("Detection error:", err);
          }
        }
      }
      
      // Loop forever
      animationFrameRef.current = requestAnimationFrame(detectHand);
    };

    detectHand();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isReady, videoRef]);

  return { isSignDetected, isHandVisible, isReady };
}