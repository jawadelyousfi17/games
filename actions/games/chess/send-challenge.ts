"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitChallengeIncoming } from "@/lib/chess/socket-bus";
import { DEFAULT_RATING } from "@/lib/chess/elo";
import {
  resolveTimeControl,
  type TimeControlId,
} from "@/lib/chess/time-controls";

const CHALLENGE_TTL_MS = 60_000;

/**
 * Sends a challenge from the calling user to another user. The challenge
 * sits PENDING for 60 seconds before auto-expiring; both sides can cancel
 * (sender) or decline (recipient) before then.
 */
export async function sendChessChallenge(
  challengedUserId: string,
  timeControlId?: TimeControlId,
): Promise<{ ok: boolean; reason?: string; challengeId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const challengerId = session.user.id;

  if (challengedUserId === challengerId)
    return { ok: false, reason: "cannot_challenge_self" };

  const tc = resolveTimeControl(timeControlId);

  // Reject duplicate pending challenges between the same pair.
  const existing = await prisma.chessChallenge.findFirst({
    where: {
      challengerId,
      challengedId: challengedUserId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already_pending" };

  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  const challenge = await prisma.chessChallenge.create({
    data: {
      challengerId,
      challengedId: challengedUserId,
      initialMs: tc.initialMs,
      incrementMs: tc.incrementMs,
      expiresAt,
    },
    include: {
      challenger: {
        select: {
          login: true,
          chessRating: { select: { rating: true } },
        },
      },
    },
  });

  emitChallengeIncoming(challengedUserId, {
    challengeId: challenge.id,
    challengerId,
    challengerLogin: challenge.challenger.login,
    challengerRating: challenge.challenger.chessRating?.rating ?? DEFAULT_RATING,
    initialMs: tc.initialMs,
    incrementMs: tc.incrementMs,
    expiresAt: expiresAt.toISOString(),
  });

  // Auto-expire timer. Best-effort — if the process restarts the row stays
  // PENDING but its `expiresAt` has passed; readers should treat it as
  // expired. The cancel/decline paths still work.
  setTimeout(() => {
    void expireIfStillPending(challenge.id).catch(() => {});
  }, CHALLENGE_TTL_MS + 500);

  return { ok: true, challengeId: challenge.id };
}

async function expireIfStillPending(challengeId: string): Promise<void> {
  const updated = await prisma.chessChallenge.updateMany({
    where: { id: challengeId, status: "PENDING" },
    data: { status: "EXPIRED", resolvedAt: new Date() },
  });
  if (updated.count === 0) return;
  const fresh = await prisma.chessChallenge.findUnique({
    where: { id: challengeId },
    select: { challengerId: true, challengedId: true },
  });
  if (!fresh) return;
  // Notify both sides via socket.
  const { emitChallengeResolved } = await import("@/lib/chess/socket-bus");
  emitChallengeResolved([fresh.challengerId, fresh.challengedId], {
    challengeId,
    status: "EXPIRED",
  });
}
