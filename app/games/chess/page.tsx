import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { Shell } from "@/components/shell/shell";
import { LobbyBoardPreview } from "@/components/chess/lobby-board-preview";
import { LobbyActionPanel } from "@/components/chess/lobby-action-panel";

const RESULT_LABEL: Record<"WHITE_WIN" | "BLACK_WIN" | "DRAW", string> = {
  WHITE_WIN: "1–0",
  BLACK_WIN: "0–1",
  DRAW: "½–½",
};

/**
 * /games/chess lobby — chess.com-styled. Centered preview board, right rail
 * with "New Game / Games / Players" tabs and the green Start Game CTA.
 */
export default async function ChessLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/games/chess`);
  }
  const userId = session.user.id;

  const recent = await prisma.chessGame.findMany({
    where: { OR: [{ whiteId: userId }, { blackId: userId }] },
    orderBy: { startedAt: "desc" },
    take: 6,
    include: {
      white: { select: { id: true, login: true } },
      black: { select: { id: true, login: true } },
    },
  });

  return (
    <Shell>
      <div className="grid h-screen grid-cols-[minmax(0,1fr)_400px]">
        {/* Center: board preview + recent games strip */}
        <div className="flex min-w-0 flex-col items-stretch gap-6 p-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-extrabold tracking-tight text-white">
              Play Chess
            </h1>
            <span className="font-mono text-[12px] text-navy-300">
              Blitz · Elo-ranked
            </span>
          </div>

          <div className="mx-auto aspect-square w-full max-w-[640px]">
            <LobbyBoardPreview />
          </div>

          <section className="mx-auto w-full max-w-[640px]">
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-navy-400">
              Recent
            </h2>
            {recent.length === 0 ? (
              <div className="rounded-md bg-navy-900 p-4 text-[13px] text-navy-300 ring-1 ring-white/5">
                No games yet. Hit Start Game to play your first match.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {recent.map((g) => {
                  const youAreWhite = g.whiteId === userId;
                  const opponent = youAreWhite ? g.black : g.white;
                  const ratingDelta =
                    g.status === "COMPLETED" &&
                    g.whiteRatingAfter !== null &&
                    g.blackRatingAfter !== null
                      ? youAreWhite
                        ? g.whiteRatingAfter - g.whiteRatingBefore
                        : g.blackRatingAfter - g.blackRatingBefore
                      : null;
                  return (
                    <li key={g.id}>
                      <Link
                        href={`/games/chess/play/${g.id}`}
                        className="flex items-center gap-4 rounded-md bg-navy-900 px-4 py-2.5 ring-1 ring-white/5 hover:bg-navy-800"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-wider text-navy-400">
                          {youAreWhite ? "white" : "black"}
                        </span>
                        <span className="flex-1 truncate text-[13px] text-white">
                          vs {opponent.login}
                        </span>
                        <span className="font-mono text-[12px] text-navy-300">
                          {g.status === "IN_PROGRESS"
                            ? "in progress"
                            : g.result
                              ? RESULT_LABEL[g.result]
                              : "—"}
                        </span>
                        {ratingDelta !== null && (
                          <span
                            className={`font-mono text-[12px] ${
                              ratingDelta > 0
                                ? "text-brand-lime"
                                : ratingDelta < 0
                                  ? "text-brand-coral"
                                  : "text-navy-300"
                            }`}
                          >
                            {ratingDelta > 0 ? "+" : ""}
                            {ratingDelta}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3 text-[12px] text-navy-300">
              or{" "}
              <Link
                href="/games/chess/play/local"
                className="text-brand-lime hover:underline"
              >
                pass-and-play locally
              </Link>
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="border-l border-white/5">
          <LobbyActionPanel />
        </div>
      </div>
    </Shell>
  );
}
