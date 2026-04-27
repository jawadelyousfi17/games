const CARDS = [
  { value: "+2", color: "#ffc857", x: -36, rotate: -10, darkInk: true },
  { value: "↺", color: "#0a0d20", x: 0, rotate: 2, darkInk: false },
  { value: "4", color: "#22c55e", x: 36, rotate: 12, darkInk: true },
] as const;

/** Uno game-poster artwork: three calm cards, no animation. */
export function UnoPoster() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 70%, rgba(255,111,145,0.3), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-0 w-0">
          {CARDS.map((c, i) => (
            <div
              key={i}
              className="absolute flex h-[120px] w-[80px] items-center justify-center rounded-xl text-[34px] font-extrabold ring-1 ring-black/40"
              style={{
                background: c.color,
                color: c.darkInk ? "#0a0d20" : "#fff",
                left: c.x * 1.6,
                top: -60,
                transform: `translate(-50%, 0) rotate(${c.rotate}deg)`,
                boxShadow:
                  "0 12px 24px -6px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.18)",
              }}
            >
              <span className="absolute inset-2 rounded-md ring-2 ring-white/25" />
              <span className="relative">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
