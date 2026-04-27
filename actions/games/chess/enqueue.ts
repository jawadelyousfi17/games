"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { DEFAULT_RATING } from "@/lib/chess/elo";

const INITIAL_MS = 5 * 60 * 1000;
const INCREMENT_MS = 0;

export type EnqueueResult =
  | { kind: "queued" }
  | { kind: "matched"; gameId: string }
  | { kind: "alreadyInGame"; gameId: string };

/**
 * Adds the current user to the matchmaking queue. If a waiting opponent is
 * already in the queue, pairs them in a single transaction and returns the
 * created game id. Otherwise the caller stays in the queue and should poll.
 *
 * Pairing is FIFO by createdAt — simplest fair policy without rating buckets.
 * Locking via SELECT … FOR UPDATE SKIP LOCKED prevents two simultaneous
 * enqueues from grabbing the same opponent.
 */
export async function enqueueChess(): Promise<EnqueueResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

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
    // Find the oldest waiting ticket that's not the current user's.
    const opponentTickets = await tx.$queryRaw<{ id: string; userId: string }[]>`
      SELECT id, "userId" FROM "ChessQueueTicket"
      WHERE "userId" <> ${userId}
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (opponentTickets.length === 0) {
      // No opponent — park ourselves in the queue.
      await tx.chessQueueTicket.upsert({
        where: { userId },
        create: { userId, initialMs: INITIAL_MS, incrementMs: INCREMENT_MS },
        update: {},
      });
      return { kind: "queued" } as const;
    }

    const opponent = opponentTickets[0];

    // Coin-flip color assignment so the queueing user isn't always white.
    const whiteId = Math.random() < 0.5 ? userId : opponent.userId;
    const blackId = whiteId === userId ? opponent.userId : userId;

    // Snapshot ratings (auto-create rows for first-time players).
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
        initialMs: INITIAL_MS,
        incrementMs: INCREMENT_MS,
        whiteMs: INITIAL_MS,
        blackMs: INITIAL_MS,
        whiteRatingBefore: whiteRating.rating ?? DEFAULT_RATING,
        blackRatingBefore: blackRating.rating ?? DEFAULT_RATING,
      },
    });

    // Drop both tickets — the match is set.
    await tx.chessQueueTicket.deleteMany({
      where: { userId: { in: [userId, opponent.userId] } },
    });

    return { kind: "matched", gameId: game.id } as const;
  });
}
