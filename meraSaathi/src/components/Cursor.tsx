import React from 'react';
import { motion } from 'framer-motion';
import { CursorPosition } from '../hooks/useHandTracking';

interface CursorProps {
  position: CursorPosition | null;
}

export function Cursor({ position }: CursorProps) {
  if (!position) return null;

  // Track the raw pixel coordinates
  const x = position.x * window.innerWidth;
  const y = position.y * window.innerHeight;
  const isPinching = position.isPinching;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[100] flex items-center justify-center will-change-transform"
      // PERFORMANCE UPGRADE: Force hardware acceleration using translate3d
      animate={{ 
        transform: `translate3d(${x - 32}px, ${y - 32}px, 0)` 
      }} 
      // Lightning-fast tracking to keep up with the webcam feed
      transition={{ type: 'spring', stiffness: 1200, damping: 40, mass: 0.05 }}
    >
      {/* Layer 1: The Outer Orbit Ring
        Spins constantly, but snaps inward and disappears when pinching 
      */}
      <motion.div
        className="absolute w-16 h-16 rounded-full border border-white/40 border-dashed will-change-transform"
        animate={{
          rotate: isPinching ? 90 : 360,
          scale: isPinching ? 0.5 : 1,
          opacity: isPinching ? 0 : 1,
        }}
        transition={{
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          scale: { type: "spring", stiffness: 500, damping: 25 },
          opacity: { duration: 0.2 }
        }}
      />

      {/* Layer 2: The Inner Reticle
        Glassmorphic when searching, solid energy core when grabbing 
      */}
      <motion.div
        className="absolute flex items-center justify-center rounded-full backdrop-blur-md will-change-transform"
        animate={{
          width: isPinching ? 28 : 44,
          height: isPinching ? 28 : 44,
          backgroundColor: isPinching ? 'rgba(255, 215, 0, 0.95)' : 'rgba(255, 255, 255, 0.15)',
          borderColor: isPinching ? '#FFF' : 'rgba(255, 255, 255, 0.6)',
          borderWidth: isPinching ? '3px' : '2px',
          boxShadow: isPinching 
            ? '0 0 40px 15px rgba(255, 215, 0, 0.4), inset 0 0 10px rgba(255,255,255,0.8)' 
            : '0 0 20px 2px rgba(255, 255, 255, 0.2)',
        }}
        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
      >
        {/* Layer 3: The Center Crosshair Dot */}
        <motion.div 
          className="w-1.5 h-1.5 rounded-full bg-white will-change-transform"
          animate={{ scale: isPinching ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Layer 4: The "Grab Shockwave" 
        Fires a quick burst ring every time the user pinches 
      */}
      <motion.div
        className="absolute w-12 h-12 rounded-full border-2 border-yellow-300 will-change-transform"
        initial={false}
        animate={{
          scale: isPinching ? 1.8 : 0.5,
          opacity: isPinching ? [0, 0.8, 0] : 0,
        }}
        transition={{ 
          duration: 0.4, 
          ease: "easeOut",
          times: [0, 0.2, 1] // Controls the fade out timing of the shockwave
        }}
      />
    </motion.div>
  );
}
