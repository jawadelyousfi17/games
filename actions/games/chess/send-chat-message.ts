"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitChatMessage } from "@/lib/chess/socket-bus";

const MAX_BODY = 500;

/**
 * Posts a chat message into a chess game's room. Only participants (white
 * or black) may send — spectators stay read-only. Body is trimmed and
 * length-capped to keep abuse / payload size in check; the DB column is
 * VARCHAR(500) so over-long inputs would error anyway.
 *
 * On success the message is broadcast to every subscriber via Socket.IO so
 * receivers don't need to refetch.
 */
export async function sendChessChatMessage(
  gameId: string,
  body: string,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (trimmed.length > MAX_BODY) return { ok: false, reason: "too_long" };

  const game = await prisma.chessGame.findUnique({
    where: { id: gameId },
    select: { whiteId: true, blackId: true },
  });
  if (!game) return { ok: false, reason: "not_found" };
  if (game.whiteId !== userId && game.blackId !== userId) {
    return { ok: false, reason: "not_a_participant" };
  }

  const created = await prisma.chessChatMessage.create({
    data: { gameId, userId, body: trimmed },
    include: { user: { select: { login: true } } },
  });

  emitChatMessage(gameId, {
    id: created.id,
    userId: created.userId,
    login: created.user.login,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
  });

  return { ok: true };
}
