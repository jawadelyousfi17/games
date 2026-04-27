/**
 * Outcome of a chess game derived from a chess.js instance.
 * Used by status components to render a single localized line.
 */
export type ChessStatus =
  | { kind: "turn"; color: "w" | "b"; inCheck: boolean }
  | { kind: "checkmate"; winner: "w" | "b" }
  | { kind: "stalemate" }
  | { kind: "draw"; reason: "50-move" | "threefold" | "insufficient" | "other" };

/** Player color, mirroring chess.js' single-letter convention. */
export type PieceColor = "w" | "b";
