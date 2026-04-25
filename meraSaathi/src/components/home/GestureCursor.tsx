import { motion, AnimatePresence } from 'framer-motion';
import { CursorPosition } from '../../hooks/useHandTracking';

interface CursorSparkle {
  id: number;
  x: number;
  y: number;
}

interface GestureCursorProps {
  cursor: CursorPosition | null;
  holdProgress: number;
  isVisible: boolean;
  isActive?: boolean;
  accentColor?: string;
  centerColor?: string;
  size?: 'default' | 'large';
  sparkles?: CursorSparkle[];
}

export function GestureCursor({
  cursor,
  holdProgress,
  isVisible,
  isActive = false,
  accentColor = '#facc15',
  centerColor = '#22d3ee',
  size = 'default',
  sparkles = [],
}: GestureCursorProps) {
  const radius = size === 'large' ? 34 : 26;
  const circumference = 2 * Math.PI * radius;
  const x = cursor ? cursor.x * window.innerWidth : -100;
  const y = cursor ? cursor.y * window.innerHeight : -100;
  const svgSize = size === 'large' ? 84 : 64;
  const centerSize = size === 'large' ? 36 : 28;

  return (
    <AnimatePresence>
      {isVisible && cursor && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: 1,
            scale: isActive ? 1.22 : holdProgress > 0 ? 1.16 : 1,
            x,
            y,
          }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 28, mass: 0.4 },
            y: { type: 'spring', stiffness: 300, damping: 28, mass: 0.4 },
            scale: { type: 'spring', stiffness: 250, damping: 18 },
          }}
          className="fixed left-0 top-0 z-[90] pointer-events-none"
          style={{ translateX: '-50%', translateY: '-50%' }}
        >
          <div className="relative flex items-center justify-center">
            {sparkles.map((sparkle) => (
              <motion.div
                key={sparkle.id}
                initial={{ opacity: 0.95, scale: 0.4, x: sparkle.x - x, y: sparkle.y - y }}
                animate={{ opacity: 0, scale: 1.25, x: sparkle.x - x, y: sparkle.y - y - 16 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-yellow-200 shadow-[0_0_16px_rgba(250,204,21,0.95)]"
                style={{ translateX: '-50%', translateY: '-50%' }}
              />
            ))}
            <svg
              className="-rotate-90 drop-shadow-[0_0_14px_rgba(255,255,255,0.6)]"
              style={{ width: svgSize, height: svgSize }}
            >
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                stroke={accentColor}
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - holdProgress * circumference}
              />
            </svg>
            <div
              className="absolute rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,214,10,0.9)]"
              style={{
                width: centerSize,
                height: centerSize,
                background: centerColor,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
