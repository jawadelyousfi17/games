import { auth } from "@/lib/auth/auth-provider";
import { getChessLeaderboard } from "@/actions/games/chess/get-leaderboard";
import { Shell } from "@/components/shell/shell";
import { Leaderboard } from "@/components/chess/leaderboard";

/** /games/chess/leaderboard — top-rated players. Public; auth optional. */
export default async function ChessLeaderboardPage() {
  const session = await auth();
  const selfUserId = session?.user?.id ?? null;

  const entries = await getChessLeaderboard(50);

  return (
    <Shell>
      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-[820px]">
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.18em] text-navy-300">
              / leaderboard
            </div>
            <h1 className="mt-2 text-[36px] font-extrabold tracking-tight text-white">
              Top players
            </h1>
            <p className="mt-1 text-[13px] text-navy-300">
              Climb the ladder. All Elo-ranked games count.
            </p>
          </div>

          <Leaderboard entries={entries} selfUserId={selfUserId} />
        </div>
      </div>
    </Shell>
  );
}
