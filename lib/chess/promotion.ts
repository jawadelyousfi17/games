import type { Chess, Square } from "chess.js";

/** Promotable piece codes accepted by chess.js. */
export type PromotionPiece = "q" | "r" | "b" | "n";

/**
 * Returns true when (from → to) is a pawn pushing into its promotion rank.
 * Used to defer applying the move until the user picks a piece — otherwise
 * react-chessboard's default `promotion: "q"` always queens.
 */
export function isPromotionMove(
  chess: Chess,
  from: string,
  to: string,
): boolean {
  const piece = chess.get(from as Square);
  if (!piece || piece.type !== "p") return false;
  if (piece.color === "w" && to[1] === "8") return true;
  if (piece.color === "b" && to[1] === "1") return true;
  return false;
}
