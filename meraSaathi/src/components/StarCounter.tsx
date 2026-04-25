import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StarCounterProps {
  stars: number;
  size?: 'small' | 'large';
}

export function StarCounter({ stars, size = 'small' }: StarCounterProps) {
  const [displayStars, setDisplayStars] = useState(stars);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (stars === displayStars) return;

    setIsAnimating(true);

    // Animate count up
    const diff = stars - displayStars;
    const steps = Math.min(Math.abs(diff), 20);
    const stepSize = diff / steps;
    let current = displayStars;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += stepSize;
      setDisplayStars(Math.round(current));

      if (step >= steps) {
        clearInterval(interval);
        setDisplayStars(stars);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [stars]);

  const isSmall = size === 'small';

  return (
    <div className={`relative flex items-center gap-2 rounded-3xl border-[${isSmall ? '4' : '5'}px] border-white bg-yellow-300 ${isSmall ? 'px-4 py-1.5' : 'px-6 py-2'} shadow-[0_8px_0_rgba(161,98,7,0.8)]`}>
      <motion.span
        animate={isAnimating ? {
          scale: [1, 1.4, 1],
          rotate: [0, -15, 15, 0],
        } : {}}
        transition={{ duration: 0.4 }}
        className={`${isSmall ? 'text-2xl' : 'text-4xl'}`}
      >
        ⭐
      </motion.span>

      <AnimatePresence mode="wait">
        <motion.span
          key={displayStars}
          initial={isAnimating ? { scale: 1.5, color: '#16a34a' } : false}
          animate={{ scale: 1, color: '#422006' }}
          className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-black text-yellow-950`}
          style={{ fontFamily: '"Comic Sans MS", cursive' }}
        >
          {displayStars}
        </motion.span>
      </AnimatePresence>

      {/* Sparkle effect on increment */}
      <AnimatePresence>
        {isAnimating && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.5,
                  x: (Math.random() - 0.5) * 60,
                  y: (Math.random() - 0.5) * 60,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute pointer-events-none text-yellow-200"
                style={{ fontSize: isSmall ? 14 : 18 }}
              >
                ✦
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
