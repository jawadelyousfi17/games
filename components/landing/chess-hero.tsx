/**
 * Quiet hero artwork: a CSS-perspective chessboard with a single piece.
 * No floating animations, no overlays, no avatar stack — just the board.
 */
export function ChessHero() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(94,198,255,0.18), transparent 60%), linear-gradient(160deg, #1a2247 0%, #0d1130 60%, #0a0d20 100%)",
        }}
      />

      <div
        className="absolute inset-0 flex items-end justify-center pb-6"
        style={{ perspective: "900px" }}
      >
        <div
          className="relative"
          style={{
            transform: "rotateX(54deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="grid h-[360px] w-[360px] grid-cols-8 grid-rows-8 rounded-md ring-1 ring-white/5">
            {Array.from({ length: 64 }).map((_, i) => {
              const r = Math.floor(i / 8);
              const f = i % 8;
              const dark = (r + f) % 2 === 1;
              return (
                <div
                  key={i}
                  className={dark ? "bg-navy-700" : "bg-navy-500/70"}
                />
              );
            })}
          </div>

          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 text-[68px] leading-none"
            style={{
              color: "#c6f24e",
              transform: "translate(-50%, -50%) translateZ(50px) rotateX(-54deg)",
              textShadow:
                "0 8px 22px rgba(198,242,78,0.45), 0 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            ♞
          </div>
        </div>
      </div>
    </div>
  );
}
