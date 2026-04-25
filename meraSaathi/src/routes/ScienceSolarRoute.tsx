import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameProvider, useGame, GameMode } from '../store/GameContext';
import { CameraFeed } from '../components/CameraFeed';
import { SolarSystem } from '../components/SolarSystem';
import { AICompanion } from '../components/AICompanion';
import { Cursor } from '../components/Cursor';
import { useHandTracking } from '../hooks/useHandTracking';

function ScienceSolarGameUI() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { cursor, isReady } = useHandTracking(videoRef);

  const { mode, triggerModeChange, isTransitioning, score, multiplier } = useGame();

  const [hasPinched, setHasPinched] = useState(false);

  useEffect(() => {
    if (cursor?.isPinching && !hasPinched) {
      setHasPinched(true);
    }
  }, [cursor?.isPinching, hasPinched]);

  const modes: { id: GameMode; label: string; icon: string; desc: string }[] = [
    { id: 'DISCOVERY', label: 'Explore', icon: '🔭', desc: 'Point to learn' },
    { id: 'ORDER', label: 'Puzzle', icon: '🧩', desc: 'Fix the orbits' },
    { id: 'FIND', label: 'Find', icon: '🔍', desc: 'Treasure hunt' },
    { id: 'GALAXY', label: 'Galaxy', icon: '🌌', desc: 'Zoom out' },
  ];

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans select-none">
      <CameraFeed ref={videoRef} />

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px) brightness(1)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px) brightness(2)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px) brightness(1)' }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-60 pointer-events-none bg-cyan-500/10 mix-blend-overlay"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-50" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReady && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
            className="absolute inset-0 z-10"
          >
            <SolarSystem cursor={cursor} />
            <Cursor position={cursor} />
          </motion.div>
        )}
      </AnimatePresence>

      {isReady && <AICompanion />}

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-70">
        <div className="flex gap-3 pointer-events-auto">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-xl px-5 py-4 rounded-3xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white font-black tracking-[0.18em] uppercase hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">←</span>
              <span className="text-xs">Home</span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, type: 'spring' }}
            className="flex gap-3 bg-black/40 backdrop-blur-xl p-2 rounded-3xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            {modes.map((m) => {
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (!isActive && !isTransitioning) triggerModeChange(m.id);
                  }}
                  className={`relative group px-5 py-3 rounded-2xl font-bold flex flex-col items-center gap-1 transition-all duration-300 ${
                    isActive
                      ? 'text-white scale-100'
                      : 'text-white/50 hover:text-white hover:bg-white/5 scale-95 hover:scale-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeModeIndicator"
                      className="absolute inset-0 bg-linear-to-b from-cyan-500/20 to-indigo-500/40 border border-cyan-400/50 rounded-2xl shadow-[inset_0_0_20px_rgba(6,182,212,0.3)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="text-2xl relative z-10 block transform group-hover:-translate-y-1 transition-transform">
                    {m.icon}
                  </span>
                  <span className="text-xs tracking-wider uppercase relative z-10">
                    {m.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, type: 'spring' }}
          className="flex flex-col items-end gap-2"
        >
          <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-cyan-500/30 text-white font-black text-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">⭐</span>
            <motion.span
              key={score}
              initial={{ scale: 1.5, color: '#22d3ee' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="min-w-[3ch] text-right"
            >
              {score}
            </motion.span>
          </div>

          <AnimatePresence>
            {multiplier > 1 && (
              <motion.div
                initial={{ x: 50, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 50, opacity: 0, scale: 0.5 }}
                className="bg-linear-to-r from-orange-600 to-amber-500 text-white px-4 py-1.5 rounded-xl text-sm font-black tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-white/20 flex items-center gap-2"
              >
                <motion.span
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  🔥
                </motion.span>
                {multiplier}x Combo
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {!hasPinched && isReady && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            className="absolute bottom-10 right-10 pointer-events-none z-60"
          >
            <div className="relative bg-cyan-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-50 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center gap-4">
              <div className="relative w-12 h-12 bg-cyan-900 rounded-full flex items-center justify-center border border-cyan-500">
                <motion.div
                  className="absolute w-4 h-4 rounded-full bg-cyan-300"
                  animate={{ top: ['20%', '40%', '20%'], left: ['20%', '40%', '20%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute w-4 h-4 rounded-full bg-cyan-300"
                  animate={{ bottom: ['20%', '40%', '20%'], right: ['20%', '40%', '20%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-wide">Pinch to Grab</span>
                <span className="text-cyan-300/70 text-sm font-medium">Bring index & thumb together</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ScienceSolarRoute() {
  return (
    <GameProvider>
      <ScienceSolarGameUI />
    </GameProvider>
  );
}
