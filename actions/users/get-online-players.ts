"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { onlineUserIds } from "@/lib/chess/online-tracker";
import { DEFAULT_RATING } from "@/lib/chess/elo";

export type OnlinePlayer = {
  id: string;
  login: string;
  image: string | null;
  rating: number;
};

/**
 * Returns the list of users currently online (excluding the caller),
 * decorated with their chess rating. Lobby uses this to populate its
 * Players tab; subsequent updates arrive via socket presence events.
 */
export async function getOnlinePlayers(): Promise<OnlinePlayer[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const selfId = session.user.id;

  const ids = onlineUserIds().filter((id) => id !== selfId);
  if (ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      login: true,
      image: true,
      chessRating: { select: { rating: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    login: u.login,
    image: u.image,
    rating: u.chessRating?.rating ?? DEFAULT_RATING,
  }));
}
