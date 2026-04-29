import type { Chess, Square } from "chess.js";

/**
 * Some users castle by dragging the king onto their own rook (e1→h1, e1→a1,
 * etc.) instead of moving it two squares. chess.js doesn't recognize that as
 * a legal king move, so without translation the drop silently fails. This
 * remaps king-onto-own-rook drops to the actual castle target square.
 *
 * Returns the resolved target square, or the original `to` if no remap
 * applies. The caller passes the result to `chess.move({ from, to })`.
 */
export function resolveCastlingTarget(
  chess: Chess,
  from: string,
  to: string,
): string {
  const piece = chess.get(from as Square);
  if (!piece || piece.type !== "k") return to;

  const target = chess.get(to as Square);
  if (!target || target.type !== "r" || target.color !== piece.color) {
    return to;
  }

  const rank = piece.color === "w" ? "1" : "8";
  if (from !== `e${rank}`) return to;

  if (to === `h${rank}`) return `g${rank}`;
  if (to === `a${rank}`) return `c${rank}`;
  return to;
}
