import { Chess } from "chess.js";

/**
 * Converts a UCI move string ("e2e4", "e7e8q") to SAN ("e4", "e8=Q") in the
 * context of a given FEN. Returns null if the move can't be replayed (e.g.
 * malformed UCI or illegal in the position).
 */
export function uciToSan(fen: string, uci: string): string | null {
  if (!uci || uci.length < 4) return null;
  const game = new Chess(fen);
  try {
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
    });
    return move?.san ?? null;
  } catch {
    return null;
  }
}
