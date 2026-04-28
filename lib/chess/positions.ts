import { Chess } from "chess.js";

export type PositionTrace = {
  /** FEN at index i is the position AFTER ply i-1 (index 0 = starting position). */
  fens: string[];
  /** Move at index i is the move that produced fens[i+1] (so it's per-ply). */
  moves: Array<{ from: string; to: string; san: string }>;
};

/**
 * Replays a SAN history through chess.js to produce parallel arrays of FENs
 * and per-ply moves. Used by the game-review walk-through to display past
 * positions and last-move highlights without recomputing on every render.
 */
export function buildPositions(history: string[]): PositionTrace {
  const game = new Chess();
  const fens: string[] = [game.fen()];
  const moves: PositionTrace["moves"] = [];
  for (const san of history) {
    let move;
    try {
      move = game.move(san);
    } catch {
      break;
    }
    if (!move) break;
    fens.push(game.fen());
    moves.push({ from: move.from, to: move.to, san: move.san });
  }
  return { fens, moves };
}
