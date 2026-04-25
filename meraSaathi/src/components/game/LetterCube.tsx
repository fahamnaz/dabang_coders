import { forwardRef } from 'react';

interface LetterCubeProps {
  letter: string;
  colorClass: string;
  shadowClass: string;
  textColor: string;
  isHovered: boolean;
  isDragging: boolean;
  isLocked: boolean;
}

export const LetterCube = forwardRef<HTMLDivElement, LetterCubeProps>(
  ({ letter, colorClass, shadowClass, textColor, isHovered, isDragging, isLocked }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute left-0 top-0 will-change-[left,top,transform] touch-none"
        style={{ 
          transform: 'translate(-50%, -50%)',
          zIndex: isDragging ? 50 : isLocked ? 10 : 20 
        }}
      >
        <div
          className={`relative flex h-[14vh] w-[14vh] min-h-[70px] min-w-[70px] items-center justify-center rounded-[28px] border-[6px] transition-transform duration-150 
            ${colorClass} 
            ${isDragging ? 'scale-110 cursor-grabbing' : isHovered && !isLocked ? 'scale-105 cursor-grab' : 'scale-100'}
          `}
          style={{
            borderColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: isDragging 
              ? `0 20px 0 ${shadowClass}, 0 25px 25px rgba(0,0,0,0.3)` 
              : isLocked 
                ? `0 4px 0 ${shadowClass}, 0 0 15px rgba(250, 204, 21, 0.5)`
                : `0 10px 0 ${shadowClass}, 0 12px 15px rgba(0,0,0,0.2)`,
            transform: isDragging ? 'translateY(-12px) rotate(-4deg)' : 'translateY(0px)',
          }}
        >
          {/* Glossy Toy Highlight */}
          <div className="absolute top-2 left-3 right-3 h-4 rounded-full bg-white/40" />
          
          <span
            className={`text-[7vh] font-black leading-none ${textColor}`}
            style={{
              fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
              textShadow: '0px 4px 0px rgba(0,0,0,0.15)',
              WebkitTextStroke: '2px rgba(255,255,255,0.5)',
            }}
          >
            {letter}
          </span>
        </div>
      </div>
    );
  }
);
LetterCube.displayName = 'LetterCube';