import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface HandData {
  x: number; // 0 to 1, normalized
  y: number; // 0 to 1, normalized
  isDrawing: boolean;
}

const EMA_ALPHA = 0.35; // Smoothing factor (0 = no update, 1 = no smoothing)

export function useMultiplayerHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>, isActive: boolean) {
  const [player1Data, setPlayer1Data] = useState<HandData | null>(null);
  const [player2Data, setPlayer2Data] = useState<HandData | null>(null);
  const [isReady, setIsReady] = useState(false);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);

  // EMA state for smoothing
  const stateRef = useRef({
    p1: { x: 0.5, y: 0.5, hasInit: false },
    p2: { x: 0.5, y: 0.5, hasInit: false }
  });

  // Helper to check if index finger is up and others are folded
  const checkIsDrawing = (landmarks: NormalizedLandmark[]) => {
    if (!landmarks || landmarks.length < 21) return false;
    
    // 8 is Index Tip, 5 is Index MCP (base)
    // 12 is Middle Tip, 16 is Ring Tip
    
    // Index finger extended upwards relative to its base
    const indexExtended = (landmarks[5].y - landmarks[8].y) > 0.04; 
    
    // Middle and Ring fingers are lower than the index tip (folded down)
    const othersFolded = landmarks[12].y > landmarks[8].y + 0.05 && 
                         landmarks[16].y > landmarks[8].y + 0.05;

    return indexExtended && othersFolded;
  };

  useEffect(() => {
    let active = true;

    const initHandTracking = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (active) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch (err) {
        console.error("Failed to initialize MediaPipe HandLandmarker:", err);
      }
    };

    initHandTracking();

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const detectHands = useCallback(() => {
    if (!videoRef.current || !landmarkerRef.current || !isActive) {
      if (isActive) animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    const video = videoRef.current;
    
    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

      let p1Raw: HandData | null = null;
      let p2Raw: HandData | null = null;

      if (results.landmarks && results.landmarks.length > 0) {
        const hands = results.landmarks.map((landmarks) => {
          const x = 1 - landmarks[8].x; // mirror x
          const y = landmarks[8].y;
          const isDrawing = checkIsDrawing(landmarks);
          return { x, y, isDrawing };
        });

        if (hands.length === 2) {
          hands.sort((a, b) => a.x - b.x); // Leftmost hand is P1
          p1Raw = hands[0];
          p2Raw = hands[1];
        } else if (hands.length === 1) {
          if (hands[0].x < 0.5) p1Raw = hands[0];
          else p2Raw = hands[0];
        }
      }

      const state = stateRef.current;

      // Smooth P1
      if (p1Raw) {
        if (!state.p1.hasInit) {
          state.p1.x = p1Raw.x;
          state.p1.y = p1Raw.y;
          state.p1.hasInit = true;
        } else {
          state.p1.x = (p1Raw.x * EMA_ALPHA) + (state.p1.x * (1 - EMA_ALPHA));
          state.p1.y = (p1Raw.y * EMA_ALPHA) + (state.p1.y * (1 - EMA_ALPHA));
        }
        
        setPlayer1Data({ x: state.p1.x, y: state.p1.y, isDrawing: p1Raw.isDrawing });
      } else {
        state.p1.hasInit = false;
        setPlayer1Data(null);
      }

      // Smooth P2
      if (p2Raw) {
        if (!state.p2.hasInit) {
          state.p2.x = p2Raw.x;
          state.p2.y = p2Raw.y;
          state.p2.hasInit = true;
        } else {
          state.p2.x = (p2Raw.x * EMA_ALPHA) + (state.p2.x * (1 - EMA_ALPHA));
          state.p2.y = (p2Raw.y * EMA_ALPHA) + (state.p2.y * (1 - EMA_ALPHA));
        }
        
        setPlayer2Data({ x: state.p2.x, y: state.p2.y, isDrawing: p2Raw.isDrawing });
      } else {
        state.p2.hasInit = false;
        setPlayer2Data(null);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectHands);
  }, [videoRef, isActive]);

  useEffect(() => {
    if (isActive && isReady) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [detectHands, isActive, isReady]);

  return { player1Data, player2Data, isReady };
}
