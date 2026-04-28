"use server";

import { Chess } from "chess.js";
import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitGameState } from "@/lib/chess/socket-bus";
import { toGameStatePayload } from "@/lib/chess/game-state";
import { finalizeChessGame } from "./finalize";

/**
 * Claims a flag-fall: the side to move has run out of time. Server recomputes
 * elapsed time from `lastMoveAt` so a malicious or out-of-sync client cannot
 * award a phantom timeout. Broadcasts the resulting state on success.
 */
export async function claimChessTimeout(gameId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const finalized = await prisma.$transaction(async (tx) => {
    const game = await tx.chessGame.findUnique({ where: { id: gameId } });
    if (!game) throw new Error("Game not found");
    if (game.status !== "IN_PROGRESS") return false;
    if (game.whiteId !== userId && game.blackId !== userId) {
      throw new Error("Not a participant");
    }

    const turn = new Chess(game.fen).turn();
    const moverMs = turn === "w" ? game.whiteMs : game.blackMs;
    const elapsed = Date.now() - game.lastMoveAt.getTime();
    if (moverMs - elapsed > 0) return false;

    await finalizeChessGame(
      tx,
      gameId,
      turn === "w" ? "BLACK_WIN" : "WHITE_WIN",
      "TIMEOUT",
    );
    return true;
  });

  if (!finalized) return false;

  const fresh = await prisma.chessGame.findUnique({
    where: { id: gameId },
    include: { moves: { select: { san: true, ply: true, uci: true } } },
  });
  if (fresh) emitGameState(gameId, toGameStatePayload(fresh));
  return true;
}
