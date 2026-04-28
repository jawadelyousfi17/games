"use server";

import { prisma } from "@/lib/prisma/prisma";
import { DEFAULT_RATING } from "@/lib/chess/elo";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  login: string;
  image: string | null;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
};

/**
 * Returns the top N players by chess rating, in descending order. Includes
 * win/loss/draw counters so the UI can show a record column.
 *
 * Players who have never played (no `ChessRating` row) are excluded — they
 * sit at the default 1200 with 0 games, which would clutter the board.
 */
export async function getChessLeaderboard(
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const rows = await prisma.chessRating.findMany({
    where: { games: { gt: 0 } },
    orderBy: [{ rating: "desc" }, { games: "desc" }],
    take: limit,
    include: {
      user: { select: { login: true, image: true } },
    },
  });

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    login: r.user.login,
    image: r.user.image,
    rating: r.rating ?? DEFAULT_RATING,
    wins: r.wins,
    losses: r.losses,
    draws: r.draws,
    games: r.games,
  }));
}
