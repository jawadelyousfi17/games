import { prisma } from "@/lib/prisma/prisma";
import { emitGameState } from "./socket-bus";
import { toGameStatePayload } from "./game-state";
import { finalizeChessGame } from "@/actions/games/chess/finalize";

/**
 * Server-only helper to forfeit an in-progress game on behalf of a player.
 *
 * Used by the disconnect watchdog: when a player drops off the websocket and
 * doesn't reconnect within the grace window, this awards the win to the
 * opponent, applies the Elo update, and broadcasts the new state.
 *
 * Idempotent for non-participants and finished games — safe to call from a
 * timer that may fire after the game already ended naturally.
 */
export async function forfeitChessGame(
  gameId: string,
  losingUserId: string,
  reason: "DISCONNECT" | "ABORT" = "DISCONNECT",
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const game = await tx.chessGame.findUnique({ where: { id: gameId } });
    if (!game) return;
    if (game.status !== "IN_PROGRESS") return;
    const isWhite = game.whiteId === losingUserId;
    const isBlack = game.blackId === losingUserId;
    if (!isWhite && !isBlack) return;
    await finalizeChessGame(
      tx,
      gameId,
      isWhite ? "BLACK_WIN" : "WHITE_WIN",
      reason,
    );
  });

  const fresh = await prisma.chessGame.findUnique({
    where: { id: gameId },
    include: { moves: { select: { san: true, ply: true, uci: true } } },
  });
  if (fresh) emitGameState(gameId, toGameStatePayload(fresh));
}
