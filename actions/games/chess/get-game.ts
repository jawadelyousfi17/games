"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { toGameStatePayload } from "@/lib/chess/game-state";
import type { GameStatePayload } from "@/lib/chess/realtime";

export type GameSnapshot = {
  id: string;
  white: { id: string; login: string; image: string | null; rating: number };
  black: { id: string; login: string; image: string | null; rating: number };
  /** Color the current viewer is allowed to move, or null if a spectator. */
  myColor: "w" | "b" | null;
  state: GameStatePayload;
  /** True once the game row has reached a terminal status. */
  finished: boolean;
};

/**
 * Loads a chess game for the current user. Throws if the game does not exist;
 * spectators (non-participants) get `myColor: null` and read-only state.
 */
export async function getChessGame(gameId: string): Promise<GameSnapshot> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const game = await prisma.chessGame.findUnique({
    where: { id: gameId },
    include: {
      white: { select: { id: true, login: true, image: true } },
      black: { select: { id: true, login: true, image: true } },
      moves: { select: { san: true, ply: true, uci: true } },
    },
  });
  if (!game) throw new Error("Game not found");

  const myColor =
    game.whiteId === userId ? "w" : game.blackId === userId ? "b" : null;

  return {
    id: game.id,
    white: {
      id: game.white.id,
      login: game.white.login,
      image: game.white.image,
      rating: game.whiteRatingBefore,
    },
    black: {
      id: game.black.id,
      login: game.black.login,
      image: game.black.image,
      rating: game.blackRatingBefore,
    },
    myColor,
    state: toGameStatePayload(game),
    finished: game.status !== "IN_PROGRESS",
  };
}
