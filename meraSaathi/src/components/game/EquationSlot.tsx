export function EquationSlot({ isFilled, isWrongShake, isCorrectGlow }: { isFilled: boolean; isWrongShake?: boolean; isCorrectGlow?: boolean }) {
  return (
    <div 
      className={`relative flex h-[14vh] w-[14vh] min-h-[70px] min-w-[70px] items-center justify-center rounded-[28px] border-[6px] transition-all duration-300
        ${isWrongShake ? 'border-rose-500 bg-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.8)]' : 
          isCorrectGlow ? 'border-green-400 bg-green-400/40 shadow-[0_0_30px_rgba(74,222,128,0.8)]' :
          isFilled ? 'border-green-400 bg-green-400/20 shadow-[inset_0_0_20px_rgba(74,222,128,0.5)]' : 'border-dashed border-white bg-white/30 backdrop-blur-sm'}
      `}
      style={{
        transform: isWrongShake ? 'translateX(0px)' : 'none',
        animation: isWrongShake ? 'shake 0.4s ease-in-out' : 'none'
      }}
    >
      {!isFilled && (
        <div className="h-6 w-6 rounded-full bg-white/60 shadow-sm" />
      )}
    </div>
  );
}