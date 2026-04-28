"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitChallengeResolved } from "@/lib/chess/socket-bus";

/** Sender cancels their own pending challenge. Receiver is notified. */
export async function cancelChessChallenge(
  challengeId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  const challenge = await prisma.chessChallenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge) return { ok: false, reason: "not_found" };
  if (challenge.challengerId !== userId)
    return { ok: false, reason: "not_yours" };
  if (challenge.status !== "PENDING") return { ok: false, reason: "not_pending" };

  await prisma.chessChallenge.update({
    where: { id: challengeId },
    data: { status: "CANCELLED", resolvedAt: new Date() },
  });

  emitChallengeResolved([challenge.challengerId, challenge.challengedId], {
    challengeId,
    status: "CANCELLED",
  });
  return { ok: true };
}
