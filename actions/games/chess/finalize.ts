import type { Prisma, ChessResult, ChessEndReason } from "@/lib/generated/prisma";
import { applyElo, type WhiteScore } from "@/lib/chess/elo";

type Tx = Prisma.TransactionClient;

const SCORE_FOR: Record<ChessResult, WhiteScore> = {
  WHITE_WIN: 1,
  BLACK_WIN: 0,
  DRAW: 0.5,
};

/**
 * Finalizes a chess game inside an open transaction: marks it COMPLETED with
 * the given end reason, applies Elo updates, and bumps win/loss/draw
 * counters. Pure DB writes; the caller broadcasts the resulting state.
 */
export async function finalizeChessGame(
  tx: Tx,
  gameId: string,
  result: ChessResult,
  reason: ChessEndReason,
): Promise<void> {
  const game = await tx.chessGame.findUniqueOrThrow({ where: { id: gameId } });
  const score = SCORE_FOR[result];

  const next = applyElo(
    game.whiteRatingBefore,
    game.blackRatingBefore,
    score,
  );

  await tx.chessGame.update({
    where: { id: gameId },
    data: {
      status: "COMPLETED",
      result,
      endReason: reason,
      endedAt: new Date(),
      whiteRatingAfter: next.white,
      blackRatingAfter: next.black,
    },
  });

  await tx.chessRating.upsert({
    where: { userId: game.whiteId },
    create: {
      userId: game.whiteId,
      rating: next.white,
      games: 1,
      wins: result === "WHITE_WIN" ? 1 : 0,
      losses: result === "BLACK_WIN" ? 1 : 0,
      draws: result === "DRAW" ? 1 : 0,
    },
    update: {
      rating: next.white,
      games: { increment: 1 },
      wins: { increment: result === "WHITE_WIN" ? 1 : 0 },
      losses: { increment: result === "BLACK_WIN" ? 1 : 0 },
      draws: { increment: result === "DRAW" ? 1 : 0 },
    },
  });

  await tx.chessRating.upsert({
    where: { userId: game.blackId },
    create: {
      userId: game.blackId,
      rating: next.black,
      games: 1,
      wins: result === "BLACK_WIN" ? 1 : 0,
      losses: result === "WHITE_WIN" ? 1 : 0,
      draws: result === "DRAW" ? 1 : 0,
    },
    update: {
      rating: next.black,
      games: { increment: 1 },
      wins: { increment: result === "BLACK_WIN" ? 1 : 0 },
      losses: { increment: result === "WHITE_WIN" ? 1 : 0 },
      draws: { increment: result === "DRAW" ? 1 : 0 },
    },
  });
}
