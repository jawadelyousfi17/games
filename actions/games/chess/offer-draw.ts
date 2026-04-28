"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitGameState } from "@/lib/chess/socket-bus";
import { toGameStatePayload } from "@/lib/chess/game-state";

/**
 * Records a draw offer from the calling user. The opponent sees a prompt
 * via the next state broadcast and can accept (game ends as DRAW) or
 * decline. Any move made by the opponent also auto-clears the offer.
 */
export async function offerDraw(
  gameId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  const game = await prisma.chessGame.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, reason: "not_found" };
  if (game.status !== "IN_PROGRESS")
    return { ok: false, reason: "game_over" };
  if (game.whiteId !== userId && game.blackId !== userId)
    return { ok: false, reason: "not_a_participant" };
  if (game.drawOfferedBy === userId)
    return { ok: false, reason: "already_offered" };
  if (game.drawOfferedBy && game.drawOfferedBy !== userId)
    return { ok: false, reason: "respond_to_existing" };

  await prisma.chessGame.update({
    where: { id: gameId },
    data: { drawOfferedBy: userId },
  });

  const fresh = await prisma.chessGame.findUnique({
    where: { id: gameId },
    include: { moves: { select: { san: true, ply: true, uci: true } } },
  });
  if (fresh) emitGameState(gameId, toGameStatePayload(fresh));

  return { ok: true };
}
