import type { ChessGame, ChessMove } from "@/lib/generated/prisma";
import type { GameStatePayload } from "./realtime";

type GameWithMoves = ChessGame & {
  moves: Pick<ChessMove, "san" | "ply" | "uci">[];
};

/**
 * Projects a Prisma ChessGame row (with moves joined) into the shared
 * payload shape. Single source of truth so DB reads stay aligned with what
 * clients render.
 */
export function toGameStatePayload(game: GameWithMoves): GameStatePayload {
  const orderedMoves = [...game.moves].sort((a, b) => a.ply - b.ply);
  const last = orderedMoves[orderedMoves.length - 1];
  // UCI is stored as e.g. "e2e4" or "e7e8q" (with promotion). Squares are the
  // first 4 chars; anything beyond is the promotion piece.
  const lastMove =
    last && last.uci.length >= 4
      ? { from: last.uci.slice(0, 2), to: last.uci.slice(2, 4) }
      : null;

  return {
    fen: game.fen,
    status: game.status,
    result: game.result,
    whiteMs: game.whiteMs,
    blackMs: game.blackMs,
    lastMoveAt: game.lastMoveAt.toISOString(),
    history: orderedMoves.map((m) => m.san),
    lastMove,
  };
}
