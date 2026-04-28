"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { DEFAULT_RATING } from "@/lib/chess/elo";
import {
  resolveTimeControl,
  type TimeControlId,
} from "@/lib/chess/time-controls";

export type EnqueueResult =
  | { kind: "queued" }
  | { kind: "matched"; gameId: string }
  | { kind: "alreadyInGame"; gameId: string };

/**
 * Adds the current user to the matchmaking queue for the given time control.
 * If a waiting opponent with the SAME time control is already in the queue,
 * pairs them in a single transaction and returns the created game id.
 *
 * Pairing is FIFO by createdAt, partitioned by initialMs/incrementMs — two
 * players with different time-control choices won't be matched together.
 *
 * Locking via SELECT … FOR UPDATE SKIP LOCKED prevents two simultaneous
 * enqueues from grabbing the same opponent.
 */
export async function enqueueChess(
  timeControlId?: TimeControlId,
): Promise<EnqueueResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const tc = resolveTimeControl(timeControlId);

  // Reuse an in-progress game if one already exists for this user.
  const ongoing = await prisma.chessGame.findFirst({
    where: {
      status: "IN_PROGRESS",
      OR: [{ whiteId: userId }, { blackId: userId }],
    },
    select: { id: true },
  });
  if (ongoing) return { kind: "alreadyInGame", gameId: ongoing.id };

  return prisma.$transaction(async (tx) => {
    // Find the oldest waiting ticket with the same time control.
    const opponentTickets = await tx.$queryRaw<{ id: string; userId: string }[]>`
      SELECT id, "userId" FROM "ChessQueueTicket"
      WHERE "userId" <> ${userId}
        AND "initialMs" = ${tc.initialMs}
        AND "incrementMs" = ${tc.incrementMs}
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (opponentTickets.length === 0) {
      await tx.chessQueueTicket.upsert({
        where: { userId },
        create: {
          userId,
          initialMs: tc.initialMs,
          incrementMs: tc.incrementMs,
        },
        update: { initialMs: tc.initialMs, incrementMs: tc.incrementMs },
      });
      return { kind: "queued" } as const;
    }

    const opponent = opponentTickets[0];

    // Coin-flip color assignment so the queueing user isn't always white.
    const whiteId = Math.random() < 0.5 ? userId : opponent.userId;
    const blackId = whiteId === userId ? opponent.userId : userId;

    const [whiteRating, blackRating] = await Promise.all([
      tx.chessRating.upsert({
        where: { userId: whiteId },
        create: { userId: whiteId },
        update: {},
      }),
      tx.chessRating.upsert({
        where: { userId: blackId },
        create: { userId: blackId },
        update: {},
      }),
    ]);

    const game = await tx.chessGame.create({
      data: {
        whiteId,
        blackId,
        initialMs: tc.initialMs,
        incrementMs: tc.incrementMs,
        whiteMs: tc.initialMs,
        blackMs: tc.initialMs,
        whiteRatingBefore: whiteRating.rating ?? DEFAULT_RATING,
        blackRatingBefore: blackRating.rating ?? DEFAULT_RATING,
      },
    });

    await tx.chessQueueTicket.deleteMany({
      where: { userId: { in: [userId, opponent.userId] } },
    });

    return { kind: "matched", gameId: game.id } as const;
  });
}
