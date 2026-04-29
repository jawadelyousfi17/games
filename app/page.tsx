import Link from "next/link";
import {
  Puzzle as PuzzleIcon,
  Bot,
  GraduationCap,
  Swords,
  Trophy,
  Crown,
} from "lucide-react";
import { Shell } from "@/components/shell/shell";
import { LobbyBoardPreview } from "@/components/chess/lobby-board-preview";
import { auth } from "@/lib/auth/auth-provider";
import { fetchDailyPuzzle } from "@/lib/chess/puzzles-api";
import { getOnlineCount } from "@/actions/users/get-online-count";
import { getChessLeaderboard } from "@/actions/games/chess/get-leaderboard";
import { prisma } from "@/lib/prisma/prisma";

const RANK_BADGE: Record<number, string> = {
  1: "bg-amber-400/15 text-amber-300",
  2: "bg-white/10 text-white",
  3: "bg-orange-400/15 text-orange-300",
};

/** Public landing page. Sits inside the chess.com-style shell. */
export default async function Page() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  // Run independent reads in parallel — none gates the others. Each is a
  // best-effort lookup; if any fails the rest of the page still renders.
  const [dailyPuzzle, onlineCount, leaders, totalGames] = await Promise.all([
    fetchDailyPuzzle().catch((err) => {
      console.error("[landing] daily puzzle failed", err);
      return null;
    }),
    getOnlineCount().catch(() => 0),
    getChessLeaderboard(5).catch(() => []),
    prisma.chessGame.count().catch(() => 0),
  ]);

  return (
    <Shell>
      <div className="min-h-screen bg-navy-950">
        <div className="mx-auto max-w-[1180px] p-6 md:p-10">
          {/* Hero */}
          <section className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-lime ring-1 ring-white/10">
                <Crown className="h-3.5 w-3.5" strokeWidth={2.25} />
                For 1337 students
              </div>
              <h1 className="mt-5 text-[clamp(40px,5vw,64px)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white">
                A small games club
                <br />
                between two pushes.
              </h1>
              <p className="mt-5 max-w-[480px] text-[15px] font-medium leading-relaxed text-navy-100">
                Sign in with your intra, queue up, and play live chess against
                fellow students. Solve a daily puzzle, train against the bot,
                or learn the basics on the side.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/games/chess"
                  className="btn-3d-lime inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-[14px] font-bold text-navy-950"
                >
                  <Swords className="h-4 w-4" strokeWidth={2.5} />
                  Play Chess
                </Link>
                <Link
                  href="/games/chess/play/bot"
                  className="btn-3d-dark inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-[14px] font-semibold text-white ring-1 ring-white/10"
                >
                  <Bot className="h-4 w-4" strokeWidth={2.25} />
                  Play vs Bot
                </Link>
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="btn-3d-dark inline-flex h-12 items-center justify-center rounded-md px-6 text-[14px] font-semibold text-white ring-1 ring-white/10"
                  >
                    Sign in with intra
                  </Link>
                )}
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-12 rounded-full bg-brand-lime/10 blur-3xl"
              />
              <div className="relative aspect-square w-full max-w-[480px] justify-self-end">
                <LobbyBoardPreview />
              </div>
            </div>
          </section>

          {/* Stats strip */}
          <section className="mt-12 grid gap-3 md:grid-cols-3">
            <StatTile
              label="Players online"
              value={onlineCount.toString()}
              accent="lime"
              hint="live"
            />
            <StatTile
              label="Games played"
              value={totalGames.toLocaleString()}
              accent="amber"
              hint="all time"
            />
            <StatTile
              label="Daily puzzle"
              value={dailyPuzzle ? `${dailyPuzzle.rating}` : "—"}
              accent="coral"
              hint={dailyPuzzle ? "Lichess Elo" : "offline"}
            />
          </section>

          {/* Quick actions */}
          <section className="mt-12">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-navy-300">
              Jump in
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                href="/games/chess"
                Icon={Swords}
                title="Online match"
                sub="Rapid · 10 min"
                accent="bg-[#769656]"
                live
              />
              <ActionCard
                href="/games/chess/play/bot"
                Icon={Bot}
                title="Play vs Bot"
                sub="5 difficulty levels"
                accent="bg-sky-700"
              />
              <ActionCard
                href="/puzzles"
                Icon={PuzzleIcon}
                title="Puzzles"
                sub="Random + daily"
                accent="bg-amber-700"
              />
              <ActionCard
                href="/learn"
                Icon={GraduationCap}
                title="Learn"
                sub="6 lessons · basics → endgames"
                accent="bg-[#7a4a26]"
              />
            </div>
          </section>

          {/* Daily puzzle + Leaderboard */}
          <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
            <div>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-navy-300">
                Daily puzzle
              </h2>
              {dailyPuzzle ? (
                <Link
                  href="/puzzles"
                  className="card-3d flex items-center gap-4 rounded-md p-4"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-brand-lime/15 text-brand-lime">
                    <PuzzleIcon className="h-7 w-7" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-extrabold text-white">
                      Today&apos;s puzzle · {dailyPuzzle.rating} Elo
                    </div>
                    <div className="truncate text-[12px] font-semibold text-navy-300">
                      {dailyPuzzle.sideToMove === "w" ? "White" : "Black"} to
                      move ·{" "}
                      {dailyPuzzle.themes.slice(0, 3).join(" · ") || "tactical"}
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-lime">
                    Solve →
                  </span>
                </Link>
              ) : (
                <div className="card-3d-static rounded-md p-4 text-[13px] text-navy-300">
                  Lichess unreachable. Random puzzles still available at{" "}
                  <Link
                    href="/puzzles"
                    className="text-brand-lime hover:underline"
                  >
                    /puzzles
                  </Link>
                  .
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-navy-300">
                Top players
                <Link
                  href="/games/chess/leaderboard"
                  className="font-bold text-brand-lime hover:underline"
                >
                  see all
                </Link>
              </h2>
              {leaders.length === 0 ? (
                <div className="card-3d-static rounded-md p-4 text-[13px] text-navy-300">
                  No ranked games yet. Be the first.
                </div>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {leaders.map((row) => (
                    <li
                      key={row.userId}
                      className="card-3d-static flex items-center gap-3 rounded-md px-4 py-2.5"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-extrabold ${
                          RANK_BADGE[row.rank] ?? "bg-white/[0.06] text-navy-200"
                        }`}
                      >
                        {row.rank}
                      </span>
                      <span className="flex-1 truncate text-[13px] font-bold text-white">
                        {row.login}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12px] font-extrabold tabular-nums text-brand-lime">
                        <Trophy className="h-3 w-3" strokeWidth={2.25} />
                        {row.rating}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
            <span>1337 students only · Khouribga · Benguerir · Rabat · Tétouan</span>
            <span>EN · v1</span>
          </footer>
        </div>
      </div>
    </Shell>
  );
}

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: "lime" | "amber" | "coral";
}) {
  const tint =
    accent === "lime"
      ? "text-brand-lime"
      : accent === "amber"
        ? "text-amber-300"
        : "text-brand-coral";
  return (
    <div className="card-3d-static rounded-md p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-navy-300">
        {label}
      </div>
      <div className={`mt-1 text-[32px] font-extrabold tabular-nums leading-none ${tint}`}>
        {value}
      </div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
        {hint}
      </div>
    </div>
  );
}

function ActionCard({
  href,
  Icon,
  title,
  sub,
  accent,
  live,
}: {
  href: string;
  Icon: typeof Bot;
  title: string;
  sub: string;
  accent: string;
  live?: boolean;
}) {
  return (
    <Link
      href={href}
      className="card-3d group flex flex-col gap-3 rounded-md p-4"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md text-white ${accent}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        {live && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-brand-lime/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-lime">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-lime shadow-[0_0_4px_rgba(129,182,76,0.6)]" />
            Live
          </span>
        )}
      </div>
      <div>
        <div className="text-[14px] font-extrabold text-white">{title}</div>
        <div className="text-[12px] font-semibold text-navy-300">{sub}</div>
      </div>
    </Link>
  );
}
