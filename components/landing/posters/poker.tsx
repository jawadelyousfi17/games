const SUITS = [
  { symbol: "♠", color: "#ffffff", x: -38, rotate: -8 },
  { symbol: "♥", color: "#ff6f91", x: 0, rotate: 2 },
  { symbol: "♦", color: "#5ec6ff", x: 38, rotate: 10 },
] as const;

/** Poker game-poster artwork: three suit cards, no animation. */
export function PokerPoster() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(183,148,255,0.3), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-0 w-0">
          {SUITS.map((s, i) => (
            <div
              key={i}
              className="absolute flex h-[100px] w-[68px] items-center justify-center rounded-lg bg-white text-[34px]"
              style={{
                color: s.color === "#ffffff" ? "#0a0d20" : s.color,
                left: s.x * 1.6,
                top: -50,
                transform: `translate(-50%, 0) rotate(${s.rotate}deg)`,
                boxShadow:
                  "0 10px 22px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,0,0,0.05)",
              }}
            >
              {s.symbol}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
