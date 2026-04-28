"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import type { ChatMessagePayload } from "@/lib/chess/realtime";

const MAX_FETCH = 100;

/**
 * Returns the most recent chat history for a game, oldest-first so the UI
 * can append-then-scroll without reversing on the client.
 *
 * Auth is required but the call is intentionally permissive about who can
 * read — participants and spectators both see chat. Tighten later if
 * private games arrive.
 */
export async function getChessChatMessages(
  gameId: string,
): Promise<ChatMessagePayload[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const rows = await prisma.chessChatMessage.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    take: MAX_FETCH,
    include: { user: { select: { login: true } } },
  });

  return rows
    .map((m) => ({
      id: m.id,
      userId: m.userId,
      login: m.user.login,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }))
    .reverse();
}
