"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { sendChessChallenge } from "./send-challenge";
import {
  resolveTimeControl,
  type TimeControlId,
} from "@/lib/chess/time-controls";
import { TIME_CONTROLS } from "@/lib/chess/time-controls";

/**
 * Sends a rematch challenge to the opponent of a finished game. Reuses the
 * existing challenge pipeline so the recipient gets the standard incoming
 * banner, and on accept both players auto-route to a fresh game with the
 * same time control as the previous one.
 */
export async function requestChessRematch(
  gameId: string,
): Promise<{ ok: boolean; reason?: string; challengeId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  const game = await prisma.chessGame.findUnique({
    where: { id: gameId },
    select: {
      whiteId: true,
      blackId: true,
      initialMs: true,
      incrementMs: true,
      status: true,
    },
  });
  if (!game) return { ok: false, reason: "not_found" };
  if (game.status === "IN_PROGRESS")
    return { ok: false, reason: "still_in_progress" };

  const opponentId =
    game.whiteId === userId
      ? game.blackId
      : game.blackId === userId
        ? game.whiteId
        : null;
  if (!opponentId) return { ok: false, reason: "not_a_player" };

  // Map the persisted (initialMs, incrementMs) back to a TimeControlId so
  // sendChessChallenge can resolve it. Fall back to the default if the
  // game's settings don't match a known bucket.
  const tc =
    TIME_CONTROLS.find(
      (t) =>
        t.initialMs === game.initialMs && t.incrementMs === game.incrementMs,
    ) ?? resolveTimeControl(undefined);

  return sendChessChallenge(opponentId, tc.id as TimeControlId);
}
