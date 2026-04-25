import React, { useEffect, forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraFeedProps {
  onVideoReady?: () => void;
}

export const CameraFeed = forwardRef<HTMLVideoElement, CameraFeedProps>(({ onVideoReady }, ref) => {
  // Track the exact state of the camera hardware
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;
    let videoEl: HTMLVideoElement | null = null;
    
    async function setupCamera() {
      if (!ref || typeof ref === 'function' || !ref.current) return;
      videoEl = ref.current;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
            facingMode: 'user'
          }
        });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        activeStream = stream;
        videoEl.srcObject = stream;
        videoEl.onloadedmetadata = () => {
          videoEl?.play();
          setTimeout(() => {
            if (isMounted) setStatus('ready');
            if (isMounted && onVideoReady) onVideoReady();
          }, 300);
        };
      } catch (err) {
        console.error("Error accessing webcam:", err);
        if (isMounted) setStatus('error');
      }
    }
    setupCamera();

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      if (videoEl) {
        videoEl.pause();
        videoEl.srcObject = null;
      }
    };
  }, [ref, onVideoReady]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
      
      {/* 1. Main Camera Feed with Cinematic Scale-In */}
      <motion.video
        ref={ref}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        playsInline
        muted
        initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
        animate={{ 
          opacity: status === 'ready' ? 1 : 0, 
          scale: status === 'ready' ? 1 : 1.1,
          filter: status === 'ready' ? 'blur(0px)' : 'blur(10px)'
        }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }} // Custom buttery easing
      />

      {/* 2. Space Helmet HUD Overlays (Only visible when ready) */}
      <AnimatePresence>
        {status === 'ready' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="pointer-events-none absolute inset-0 z-0"
          >
            {/* Cinematic Vignette (Darkens edges to focus attention on the center) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
            
            {/* Spatial Color Grading (Slight indigo tint to make the room look like space) */}
            <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay" />
            
            {/* Subtle Holographic Scanlines */}
            <div className="absolute inset-0 opacity-[0.02] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#fff_2px,#fff_4px)] mix-blend-overlay" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. The Boot Sequence (Loading State) */}
      <AnimatePresence>
        {status === 'initializing' && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-cyan-400"
          >
            {/* Futuristic Scanning Radar */}
            <div className="relative w-32 h-32 mb-8">
              <motion.div 
                className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-400 border-r-cyan-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 rounded-full border border-indigo-500/20 border-b-indigo-400"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Initializing Visor
            </h2>
            <motion.p 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-3 text-sm text-cyan-500/60 font-mono tracking-widest"
            >
              AWAITING SPATIAL FEED...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Glassmorphic Error State */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="bg-rose-950/40 border border-rose-500/30 p-8 rounded-3xl max-w-md text-center shadow-[0_0_50px_rgba(225,29,72,0.15)] backdrop-blur-md"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30 shadow-[inset_0_0_20px_rgba(225,29,72,0.2)]">
                <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Camera Denied</h3>
              <p className="text-rose-200/70 text-sm leading-relaxed mb-6 font-medium">
                To explore the Magic Solar System, your Space Guide needs to see your hands! Allow camera access in your browser to begin.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold tracking-wide shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                Reload Space Station
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
});
