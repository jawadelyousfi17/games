"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";

export type MatchPollResult =
  | { kind: "none" }
  | { kind: "queued" }
  | { kind: "found"; gameId: string };

/**
 * Polled by the matchmaking client every couple of seconds. Reports either
 * "your queue ticket still exists", "you have an in-progress game", or "neither".
 */
export async function getMyChessMatch(): Promise<MatchPollResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const ongoing = await prisma.chessGame.findFirst({
    where: {
      status: "IN_PROGRESS",
      OR: [{ whiteId: userId }, { blackId: userId }],
    },
    select: { id: true },
    orderBy: { startedAt: "desc" },
  });
  if (ongoing) return { kind: "found", gameId: ongoing.id };

  const ticket = await prisma.chessQueueTicket.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (ticket) return { kind: "queued" };

  return { kind: "none" };
}
