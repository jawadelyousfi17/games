"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { onlineUserIds } from "@/lib/chess/online-tracker";
import { DEFAULT_RATING } from "@/lib/chess/elo";

export type FoundUser = {
  id: string;
  login: string;
  image: string | null;
  rating: number;
  online: boolean;
  playing: boolean;
};

/**
 * Loose login-prefix search across the whole user table. Used by the lobby
 * Players tab to challenge anyone, not just users currently online.
 */
export async function searchUsers(prefix: string): Promise<FoundUser[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const selfId = session.user.id;

  const trimmed = prefix.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      login: { startsWith: trimmed, mode: "insensitive" },
      NOT: { id: selfId },
    },
    take: 25,
    orderBy: { login: "asc" },
    select: {
      id: true,
      login: true,
      image: true,
      chessRating: { select: { rating: true } },
    },
  });

  const userIds = users.map((u) => u.id);
  const activeGames = userIds.length
    ? await prisma.chessGame.findMany({
        where: {
          status: "IN_PROGRESS",
          OR: [{ whiteId: { in: userIds } }, { blackId: { in: userIds } }],
        },
        select: { whiteId: true, blackId: true },
      })
    : [];
  const playing = new Set<string>();
  for (const g of activeGames) {
    playing.add(g.whiteId);
    playing.add(g.blackId);
  }

  const online = new Set(onlineUserIds());
  return users.map((u) => ({
    id: u.id,
    login: u.login,
    image: u.image,
    rating: u.chessRating?.rating ?? DEFAULT_RATING,
    online: online.has(u.id),
    playing: playing.has(u.id),
  }));
}
