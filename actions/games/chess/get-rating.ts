"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { DEFAULT_RATING } from "@/lib/chess/elo";

export type RatingSummary = {
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
};

/**
 * Returns the calling user's chess rating summary, creating a default row on
 * first read so subsequent updates always have a target.
 */
export async function getMyRating(): Promise<RatingSummary> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const row = await prisma.chessRating.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });
  return {
    rating: row.rating ?? DEFAULT_RATING,
    games: row.games,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
  };
}
