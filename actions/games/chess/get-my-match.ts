"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { pruneStaleQueueTickets } from "@/lib/chess/queue-cleanup";

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

  // Prune any tickets that have outlived the search window. If the caller's
  // own ticket is among them, the lookup below returns null → "none", which
  // the client uses to drop back to the idle CTA.
  await pruneStaleQueueTickets();

  const ticket = await prisma.chessQueueTicket.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (ticket) return { kind: "queued" };

  return { kind: "none" };
}
