export function SlotBox({ isFilled, isWrongShake }: { isFilled: boolean; isWrongShake?: boolean }) {
  return (
    <div 
      className={`relative flex h-[15vh] w-[15vh] min-h-[75px] min-w-[75px] items-center justify-center rounded-[32px] border-[6px] transition-all duration-300
        ${isWrongShake ? 'border-rose-400 bg-rose-400/30' : 
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