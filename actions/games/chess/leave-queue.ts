"use server";

import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";

/** Removes the calling user from the matchmaking queue. No-op if not queued. */
export async function leaveChessQueue(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await prisma.chessQueueTicket.deleteMany({
    where: { userId: session.user.id },
  });
}
