"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitGameState } from "@/lib/chess/socket-bus";
import { toGameStatePayload } from "@/lib/chess/game-state";
import { finalizeChessGame } from "./finalize";

/**
 * Accepts an open draw offer from the opponent. Finalizes the game as
 * DRAW with reason DRAW_AGREED, applies Elo, broadcasts new state.
 */
export async function acceptDraw(
  gameId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    const game = await tx.chessGame.findUnique({ where: { id: gameId } });
    if (!game) throw new Error("not_found");
    if (game.status !== "IN_PROGRESS") throw new Error("game_over");
    if (game.whiteId !== userId && game.blackId !== userId)
      throw new Error("not_a_participant");
    if (!game.drawOfferedBy || game.drawOfferedBy === userId)
      throw new Error("no_pending_offer");

    await finalizeChessGame(tx, gameId, "DRAW", "DRAW_AGREED");
    // Clearing drawOfferedBy isn't strictly required (game is over), but
    // keeps queries that read it on completed games meaningful.
    await tx.chessGame.update({
      where: { id: gameId },
      data: { drawOfferedBy: null },
    });
  });

  const fresh = await prisma.chessGame.findUnique({
    where: { id: gameId },
    include: { moves: { select: { san: true, ply: true, uci: true } } },
  });
  if (fresh) emitGameState(gameId, toGameStatePayload(fresh));

  return { ok: true };
}
