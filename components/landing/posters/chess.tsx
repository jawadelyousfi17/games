/** Chess game-poster artwork. Single calm knight on a checker pattern. */
export function ChessPoster() {
  return (
    <div className="absolute inset-0">
      <div className="chess-grid absolute inset-0 opacity-25" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-[120px] leading-none"
          style={{
            color: "#5ec6ff",
            textShadow:
              "0 8px 30px rgba(94,198,255,0.45), 0 4px 0 rgba(0,0,0,0.4)",
          }}
        >
          ♞
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
