"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { DEFAULT_RATING } from "@/lib/chess/elo";

export type PendingChallenge = {
  challengeId: string;
  challengerId: string;
  challengerLogin: string;
  challengerRating: number;
  initialMs: number;
  incrementMs: number;
  expiresAt: string;
};

/**
 * Returns challenges currently pending for the calling user. Used to
 * hydrate a freshly-loaded page so notification dialogs reappear after
 * navigation (the live socket events fire only while the user was online).
 */
export async function getMyPendingChallenges(): Promise<PendingChallenge[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  const rows = await prisma.chessChallenge.findMany({
    where: {
      challengedId: userId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      challenger: {
        select: {
          id: true,
          login: true,
          chessRating: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((c) => ({
    challengeId: c.id,
    challengerId: c.challenger.id,
    challengerLogin: c.challenger.login,
    challengerRating: c.challenger.chessRating?.rating ?? DEFAULT_RATING,
    initialMs: c.initialMs,
    incrementMs: c.incrementMs,
    expiresAt: c.expiresAt.toISOString(),
  }));
}
