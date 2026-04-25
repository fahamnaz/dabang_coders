import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { useProgress } from '../store/ProgressContext';

const HEADING_FONT = '"Fredoka One", "Arial Rounded MT Bold", "Varela Round", "Comic Sans MS", sans-serif';

export function RewardPopup() {
  const { newBadges, clearNewBadges } = useProgress();
  const badge = newBadges[0] || null;

  useEffect(() => {
    if (!badge) return;

    // Epic confetti explosion
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors: ['#fde047', '#4ade80', '#38bdf8', '#f472b6', '#a78bfa'],
        shapes: ['star'],
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors: ['#fde047', '#4ade80', '#38bdf8', '#f472b6', '#a78bfa'],
        shapes: ['star'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      clearNewBadges();
    }, 5000);

    return () => clearTimeout(timer);
  }, [badge, clearNewBadges]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={clearNewBadges}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 100, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className="flex flex-col items-center rounded-[60px] border-[10px] border-white bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 p-10 sm:p-14 shadow-[0_30px_0_rgba(154,52,18,0.8)]"
          >
            {/* Glowing ring behind the badge */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-yellow-200 blur-2xl"
                style={{ width: 180, height: 180, top: -20, left: -20 }}
              />
              <motion.span
                animate={{ y: [0, -20, 0], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative text-[140px] drop-shadow-2xl block"
              >
                {badge.emoji}
              </motion.span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-5xl sm:text-6xl font-black text-white text-center"
              style={{
                fontFamily: HEADING_FONT,
                WebkitTextStroke: '4px #9a3412',
                textShadow: '0 8px 0 rgba(0,0,0,0.2)',
              }}
            >
              NEW BADGE!
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="mt-4 rounded-full border-4 border-white bg-white px-8 py-3 shadow-[0_8px_0_rgba(0,0,0,0.15)]"
            >
              <p
                className="text-3xl font-black text-amber-700"
                style={{ fontFamily: HEADING_FONT }}
              >
                {badge.name}
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-xl font-bold text-amber-100"
            >
              You reached {badge.threshold} stars! ⭐
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity }}
              className="mt-6 text-lg font-bold text-white/70"
            >
              Tap to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
