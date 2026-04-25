import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AdaptiveBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
  performanceScore: number;
  isLoading?: boolean;
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'bg-emerald-400', border: 'border-emerald-300', shadow: '#059669', emoji: '🌱', glow: 'rgba(16,185,129,0.4)' },
  medium: { label: 'Medium', color: 'bg-amber-400', border: 'border-amber-300', shadow: '#d97706', emoji: '💪', glow: 'rgba(245,158,11,0.4)' },
  hard: { label: 'Hard', color: 'bg-rose-400', border: 'border-rose-300', shadow: '#e11d48', emoji: '🔥', glow: 'rgba(225,29,72,0.4)' },
};

export function AdaptiveBadge({ difficulty, performanceScore, isLoading }: AdaptiveBadgeProps) {
  const [prevDifficulty, setPrevDifficulty] = useState(difficulty);
  const [showChange, setShowChange] = useState(false);

  useEffect(() => {
    if (difficulty !== prevDifficulty) {
      setShowChange(true);
      const timer = setTimeout(() => {
        setPrevDifficulty(difficulty);
        setShowChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [difficulty, prevDifficulty]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-full border-[4px] border-white bg-slate-200 px-4 py-1.5 shadow-[0_6px_0_rgba(0,0,0,0.1)] animate-pulse">
        <span className="text-xl">🧠</span>
        <span className="text-sm font-bold text-slate-400" style={{ fontFamily: '"Comic Sans MS", cursive' }}>AI...</span>
      </div>
    );
  }

  const config = DIFFICULTY_CONFIG[difficulty];
  const scorePercent = Math.round(performanceScore * 100);

  return (
    <div className="relative">
      <motion.div
        layout
        className={`flex items-center gap-2 rounded-full border-[4px] border-white ${config.color} px-4 py-1.5 shadow-[0_6px_0_${config.shadow}]`}
        style={{ boxShadow: `0 6px 0 ${config.shadow}, 0 0 20px ${config.glow}` }}
        animate={showChange ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          className="text-xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          🧠
        </motion.span>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
            AI Level
          </span>
          <span className="text-sm font-black text-white" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
            {config.emoji} {config.label}
          </span>
        </div>
        <div className="ml-1 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/60 bg-white/20 flex items-center justify-center">
            <span className="text-[10px] font-black text-white">{scorePercent}%</span>
          </div>
        </div>
      </motion.div>

      {/* Difficulty Change Notification */}
      <AnimatePresence>
        {showChange && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-black shadow-lg border-2 border-violet-200"
            style={{ fontFamily: '"Comic Sans MS", cursive' }}
          >
            ✨ Difficulty Changed!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
