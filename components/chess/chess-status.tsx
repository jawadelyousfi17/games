import type { ChessStatus } from "@/types/chess";

type ChessStatusProps = {
  status: ChessStatus;
};

const COLOR_LABEL: Record<"w" | "b", string> = {
  w: "White",
  b: "Black",
};

/** Single-line status indicator for a chess game (turn / check / mate / draw). */
export function ChessStatusBadge({ status }: ChessStatusProps) {
  const { text, accent } = describe(status);
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-full bg-white/[0.03] px-3 font-mono text-[12px] text-white ring-1 ring-white/10">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: accent }}
      />
      {text}
    </div>
  );
}

function describe(status: ChessStatus): { text: string; accent: string } {
  switch (status.kind) {
    case "turn":
      return {
        text: status.inCheck
          ? `${COLOR_LABEL[status.color]} to move · check`
          : `${COLOR_LABEL[status.color]} to move`,
        accent: status.inCheck ? "#ff6f91" : "#c6f24e",
      };
    case "checkmate":
      return {
        text: `Checkmate · ${COLOR_LABEL[status.winner]} wins`,
        accent: "#c6f24e",
      };
    case "stalemate":
      return { text: "Stalemate · draw", accent: "#ffc857" };
    case "draw":
      return { text: `Draw · ${status.reason}`, accent: "#ffc857" };
  }
}
