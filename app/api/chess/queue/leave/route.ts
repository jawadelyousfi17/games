import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";

/**
 * Beacon endpoint hit on tab/window close to wipe the caller's queue ticket
 * before the browser tears down. Server actions don't survive `pagehide`,
 * so a plain POST + `navigator.sendBeacon` is the only reliable path.
 */
export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await prisma.chessQueueTicket.deleteMany({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
