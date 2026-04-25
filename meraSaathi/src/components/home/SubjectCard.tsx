import { motion } from 'framer-motion';
import { SubjectDefinition } from '../../data/subjects';

interface SubjectCardProps {
  subject: SubjectDefinition;
  isHovered: boolean;
  holdProgress: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  setRef?: (element: HTMLButtonElement | null) => void;
}

export function SubjectCard({
  subject,
  isHovered,
  holdProgress,
  onClick,
  onMouseEnter,
  onMouseLeave,
  setRef,
}: SubjectCardProps) {
  const outlineColor = subject.accent;

  return (
    <motion.button
      ref={setRef}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      animate={{
        y: [0, -8, 0],
        scale: isHovered ? 1.08 : 1,
        rotate: isHovered ? [0, -1.5, 1.5, 0] : 0,
      }}
      transition={{
        y: { duration: 3 + holdProgress, repeat: Infinity, ease: 'easeInOut' },
        scale: { type: 'spring', stiffness: 280, damping: 18 },
        rotate: { duration: 0.45 },
      }}
      className="relative w-full rounded-[34px] border-[5px] border-white bg-white/95 px-5 py-6 text-left shadow-[0_18px_0_rgba(0,0,0,0.18)] outline-none"
      style={{
        boxShadow: `0 20px 0 rgba(0, 0, 0, 0.16), 0 0 0 5px ${outlineColor}, 0 18px 42px ${subject.shadow}`,
      }}
    >
      <motion.div
        animate={{
          opacity: isHovered ? 1 : 0.5,
          scale: isHovered ? 1 : 0.92,
        }}
        className="absolute inset-0 rounded-[28px]"
        style={{
          background: `radial-gradient(circle at top left, ${subject.accent}55 0%, transparent 58%)`,
        }}
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-5xl sm:text-6xl drop-shadow-[0_6px_0_rgba(255,255,255,0.8)]">
            {subject.emoji}
          </span>
          <div
            className="h-14 w-14 rounded-full border-[4px] border-white bg-white/90 flex items-center justify-center text-lg font-black"
            style={{
              color: subject.accent,
              boxShadow: `0 0 0 4px ${subject.accent}`,
            }}
          >
            {Math.round(holdProgress * 100)}%
          </div>
        </div>

        <div>
          <h3
            className="text-3xl sm:text-4xl font-black leading-none tracking-tight"
            style={{
              color: '#ffffff',
              fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
              WebkitTextStroke: `3px ${subject.textStroke}`,
              textShadow: '0 5px 0 rgba(0, 0, 0, 0.2)',
            }}
          >
            {subject.name}
          </h3>
          <p
            className="mt-2 text-lg font-black"
            style={{
              color: subject.textStroke,
              fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
              WebkitTextStroke: '0.4px rgba(255,255,255,0.35)',
            }}
          >
            {subject.mascotPrompt}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
