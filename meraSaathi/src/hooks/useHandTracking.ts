import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export interface CursorPosition {
  x: number;
  y: number;
  z: number;           // Depth (for 3D scaling)
  vx: number;          // Velocity X (for throwing physics)
  vy: number;          // Velocity Y
  isPinching: boolean;
}

// --- GOD LEVEL TUNING PARAMETERS ---
const SMOOTHING_FACTOR = 0.35; // Lower = smoother but more delay (0.0 to 1.0)
const VELOCITY_SMOOTHING = 0.2;
const PINCH_START_THRESHOLD = 0.045; // Distance to TRIGGER a grab
const PINCH_STOP_THRESHOLD = 0.065;  // Distance to RELEASE a grab (Hysteresis)

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [cursor, setCursor] = useState<CursorPosition | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  
  // Physics State Refs (Kept out of React state to prevent render thrashing)
  const physicsRef = useRef({
    smoothedX: 0.5,
    smoothedY: 0.5,
    smoothedZ: 0,
    vx: 0,
    vy: 0,
    isPinching: false,
    hasInitialized: false,
    lastTime: 0
  });

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        if (!active) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6, // Cranked up for stability
        });

        if (!active) return;
        
        handLandmarkerRef.current = handLandmarker;
        setIsReady(true);
      } catch (err) {
        console.error("Error initializing spatial tracking:", err);
      }
    }

    init();

    return () => {
      active = false;
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    const video = videoRef.current;
    let lastVideoTime = -1;

    const detect = (currentTime: number) => {
      if (video.readyState >= 2 && handLandmarkerRef.current) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          
          const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
          const state = physicsRef.current;
          
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // 1. Calculate Raw Coordinates (Mirrored)
            const rawX = 1 - indexTip.x; 
            const rawY = indexTip.y;
            const rawZ = indexTip.z; // Depth relative to wrist

            // 2. First-Frame Initialization
            if (!state.hasInitialized) {
              state.smoothedX = rawX;
              state.smoothedY = rawY;
              state.smoothedZ = rawZ;
              state.hasInitialized = true;
            }

            // 3. Time Delta for Velocity Calculation
            const dt = currentTime - state.lastTime;
            state.lastTime = currentTime;

            // 4. Exponential Moving Average (EMA) Smoothing
            const newSmoothedX = (rawX * SMOOTHING_FACTOR) + (state.smoothedX * (1 - SMOOTHING_FACTOR));
            const newSmoothedY = (rawY * SMOOTHING_FACTOR) + (state.smoothedY * (1 - SMOOTHING_FACTOR));
            const newSmoothedZ = (rawZ * SMOOTHING_FACTOR) + (state.smoothedZ * (1 - SMOOTHING_FACTOR));

            // 5. Velocity Calculation (Smoothed to prevent erratic spikes)
            if (dt > 0) {
              const rawVx = (newSmoothedX - state.smoothedX) / dt;
              const rawVy = (newSmoothedY - state.smoothedY) / dt;
              state.vx = (rawVx * VELOCITY_SMOOTHING) + (state.vx * (1 - VELOCITY_SMOOTHING));
              state.vy = (rawVy * VELOCITY_SMOOTHING) + (state.vy * (1 - VELOCITY_SMOOTHING));
            }

            state.smoothedX = newSmoothedX;
            state.smoothedY = newSmoothedY;
            state.smoothedZ = newSmoothedZ;

            // 6. Hysteresis Pinch Detection
            const dx = indexTip.x - thumbTip.x;
            const dy = indexTip.y - thumbTip.y;
            const dz = indexTip.z - thumbTip.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz); // 3D Distance is more accurate
            
            if (!state.isPinching && distance < PINCH_START_THRESHOLD) {
              state.isPinching = true; // Snap closed
            } else if (state.isPinching && distance > PINCH_STOP_THRESHOLD) {
              state.isPinching = false; // Snap open
            }

            // 7. Fire React State (Only push the heavily filtered data)
            setCursor({
              x: state.smoothedX, 
              y: state.smoothedY,
              z: state.smoothedZ,
              vx: state.vx,
              vy: state.vy,
              isPinching: state.isPinching
            });

          } else {
            // Hand lost, reset initialization flag
            if (state.hasInitialized) {
              state.hasInitialized = false;
              setCursor(null);
            }
          }
        }
      }
      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isReady, videoRef]);

  return { cursor, isReady };
}