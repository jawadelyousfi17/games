"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitChallengeResolved } from "@/lib/chess/socket-bus";
import { DEFAULT_RATING } from "@/lib/chess/elo";

/**
 * Accepts an incoming challenge: marks it ACCEPTED, creates the ChessGame
 * row with random color assignment, and notifies both sides via socket so
 * they can navigate to the new game.
 */
export async function acceptChessChallenge(
  challengeId: string,
): Promise<{ ok: boolean; reason?: string; gameId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  const result = await prisma.$transaction(async (tx) => {
    const challenge = await tx.chessChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) return { ok: false as const, reason: "not_found" };
    if (challenge.challengedId !== userId)
      return { ok: false as const, reason: "not_addressed_to_you" };
    if (challenge.status !== "PENDING")
      return { ok: false as const, reason: "not_pending" };
    if (challenge.expiresAt.getTime() <= Date.now())
      return { ok: false as const, reason: "expired" };

    // Random color assignment so the receiver isn't always black.
    const whiteId =
      Math.random() < 0.5 ? challenge.challengerId : challenge.challengedId;
    const blackId =
      whiteId === challenge.challengerId
        ? challenge.challengedId
        : challenge.challengerId;

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
        initialMs: challenge.initialMs,
        incrementMs: challenge.incrementMs,
        whiteMs: challenge.initialMs,
        blackMs: challenge.initialMs,
        whiteRatingBefore: whiteRating.rating ?? DEFAULT_RATING,
        blackRatingBefore: blackRating.rating ?? DEFAULT_RATING,
      },
    });

    await tx.chessChallenge.update({
      where: { id: challengeId },
      data: {
        status: "ACCEPTED",
        resolvedAt: new Date(),
        gameId: game.id,
      },
    });

    return {
      ok: true as const,
      gameId: game.id,
      participants: [challenge.challengerId, challenge.challengedId],
    };
  });

  if (result.ok) {
    emitChallengeResolved(result.participants, {
      challengeId,
      status: "ACCEPTED",
      gameId: result.gameId,
    });
    return { ok: true, gameId: result.gameId };
  }
  return result;
}
