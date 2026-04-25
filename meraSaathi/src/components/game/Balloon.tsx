import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import type { BalloonData } from '../../utils/letterMatch';

interface BalloonProps {
  data: BalloonData;
  isHovered: boolean;
  isDragging: boolean;
}

export const Balloon = forwardRef<HTMLDivElement, BalloonProps>(
  ({ data, isHovered, isDragging }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute left-0 top-0 will-change-transform z-20"
        style={{ transform: 'translate(-50%, -50%)' }} // Center origin
      >
        <motion.div
          animate={{
            scale: isDragging ? 1.15 : isHovered ? 1.08 : 1,
            rotate: isDragging ? -5 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative flex flex-col items-center justify-center cursor-grab"
        >
          {/* Balloon Body */}
          <div
            className={`flex h-36 w-32 items-center justify-center rounded-[50%] border-4 border-white shadow-[0_15px_0_rgba(0,0,0,0.15)] ${data.color} ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{ borderBottomLeftRadius: '45%', borderBottomRightRadius: '45%' }}
          >
            <span
              className="text-7xl font-black text-white"
              style={{
                fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
                WebkitTextStroke: '2px rgba(0,0,0,0.2)',
                textShadow: '2px 4px 0 rgba(0,0,0,0.15)',
              }}
            >
              {data.letter}
            </span>
          </div>

          {/* Balloon Knot & String */}
          <div className={`mt-[-4px] h-3 w-4 border-2 border-white rounded-sm ${data.color} z-10`} />
          <svg width="20" height="40" viewBox="0 0 20 40" className="opacity-60">
            <path
              d="M10,0 Q20,10 10,20 T10,40"
              fill="transparent"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
      </div>
    );
  }
);

Balloon.displayName = 'Balloon';
