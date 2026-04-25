export function WordImage({ emoji, hint }: { emoji: string; hint: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-32 w-32 items-center justify-center rounded-[36px] border-[6px] border-white bg-violet-500 shadow-[0_12px_0_rgba(76,29,149,0.8)]">
        <span className="text-7xl drop-shadow-lg">{emoji}</span>
      </div>
      <div className="mt-6 rounded-full border-4 border-white bg-sky-400 px-6 py-2 shadow-[0_6px_0_rgba(2,132,199,0.8)]">
        <p className="text-lg font-black text-white" style={{ fontFamily: '"Comic Sans MS", cursive', WebkitTextStroke: '1px #0284c7' }}>
          {hint}
        </p>
      </div>
    </div>
  );
}