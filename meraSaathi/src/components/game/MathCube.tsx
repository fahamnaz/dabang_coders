import { forwardRef } from 'react';

interface MathCubeProps {
  value: string;
  colorClass: string;
  shadowClass: string;
  textColor: string;
  isHovered: boolean;
  isDragging: boolean;
  isLocked: boolean;
  initialX: number;
  initialY: number;
}

export const MathCube = forwardRef<HTMLDivElement, MathCubeProps>(
  ({ value, colorClass, shadowClass, textColor, isHovered, isDragging, isLocked, initialX, initialY }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute will-change-[left,top,transform] touch-none"
        style={{ 
          left: `${initialX}vw`, 
          top: `${initialY}vh`, 
          transform: 'translate(-50%, -50%)',
          zIndex: isDragging ? 50 : isLocked ? 10 : 20 
        }}
      >
        <div
          className={`relative flex h-[13vh] w-[13vh] min-h-[65px] min-w-[65px] items-center justify-center rounded-[24px] border-[5px] transition-transform duration-150 
            ${colorClass} 
            ${isDragging ? 'scale-110 cursor-grabbing' : isHovered && !isLocked ? 'scale-105 cursor-grab' : 'scale-100'}
          `}
          style={{
            borderColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: isDragging 
              ? `0 18px 0 ${shadowClass}, 0 25px 25px rgba(0,0,0,0.3)` 
              : isLocked 
                ? `0 4px 0 ${shadowClass}, 0 0 15px rgba(74, 222, 128, 0.6)`
                : `0 8px 0 ${shadowClass}, 0 12px 15px rgba(0,0,0,0.2)`,
            transform: isDragging ? 'translateY(-10px) rotate(-3deg)' : isLocked ? 'translateY(0px) rotate(0deg)' : 'translateY(0px)',
          }}
        >
          {/* Glossy Toy Highlight */}
          <div className="absolute top-2 left-2 right-2 h-3 rounded-full bg-white/40" />
          
          <div className="absolute inset-0 flex items-center justify-center pt-1 pointer-events-none">
            <span
              className={`text-[6vh] font-black ${textColor}`}
              style={{
                fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
                textShadow: '0px 3px 0px rgba(0,0,0,0.15)',
                WebkitTextStroke: '2px rgba(255,255,255,0.4)',
              }}
            >
              {value}
            </span>
          </div>
        </div>
      </div>
    );
  }
);
MathCube.displayName = 'MathCube';