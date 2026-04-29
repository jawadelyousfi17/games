import { prisma } from "@/lib/prisma/prisma";

/**
 * A ticket older than this is considered abandoned — the user likely closed
 * the tab without the unmount/beacon cleanup firing. Two minutes matches the
 * client-side searching timeout so behavior stays consistent across tabs.
 */
export const QUEUE_TICKET_TTL_MS = 2 * 60 * 1000;

/**
 * Deletes queue tickets whose createdAt is older than the TTL. Called from
 * any matchmaking codepath (enqueue, poll, dequeue) so a stale ticket never
 * matches a fresh opponent. Cheap query — indexed on createdAt.
 */
export async function pruneStaleQueueTickets(): Promise<void> {
  const cutoff = new Date(Date.now() - QUEUE_TICKET_TTL_MS);
  await prisma.chessQueueTicket.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
}
