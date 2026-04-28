"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitGameState } from "@/lib/chess/socket-bus";
import { toGameStatePayload } from "@/lib/chess/game-state";

/**
 * Declines the pending draw offer. Either side may decline their own or
 * the opponent's offer (calling decline-on-self also acts as a "rescind").
 */
export async function declineDraw(
  gameId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  const game = await prisma.chessGame.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, reason: "not_found" };
  if (game.status !== "IN_PROGRESS") return { ok: false, reason: "game_over" };
  if (game.whiteId !== userId && game.blackId !== userId)
    return { ok: false, reason: "not_a_participant" };
  if (!game.drawOfferedBy) return { ok: false, reason: "no_pending_offer" };

  await prisma.chessGame.update({
    where: { id: gameId },
    data: { drawOfferedBy: null },
  });

  const fresh = await prisma.chessGame.findUnique({
    where: { id: gameId },
    include: { moves: { select: { san: true, ply: true, uci: true } } },
  });
  if (fresh) emitGameState(gameId, toGameStatePayload(fresh));

  return { ok: true };
}
