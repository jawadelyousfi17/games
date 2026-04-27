"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { finalizeChessGame } from "./finalize";

/**
 * Forfeits the current game. Awards the win to the opponent and updates Elo.
 * The opponent will pick up the new state on their next poll.
 */
export async function resignChessGame(gameId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    const game = await tx.chessGame.findUnique({ where: { id: gameId } });
    if (!game) throw new Error("Game not found");
    if (game.status !== "IN_PROGRESS") throw new Error("Game already ended");

    const myColor =
      game.whiteId === userId ? "w" : game.blackId === userId ? "b" : null;
    if (!myColor) throw new Error("Not a participant");

    await finalizeChessGame(
      tx,
      gameId,
      myColor === "w" ? "BLACK_WIN" : "WHITE_WIN",
    );
  });
}
