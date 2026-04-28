import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LeaderboardEntry } from "@/actions/games/chess/get-leaderboard";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  /** Caller's user id — highlights their row when present in the list. */
  selfUserId: string | null;
};

/**
 * Ranked list of top-rated players. Top 3 get a colored rank pill
 * (gold/silver/bronze); the caller's own row gets a lime accent so they
 * can spot themselves on the board.
 */
export function Leaderboard({ entries, selfUserId }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md bg-navy-900 p-8 text-center text-[14px] font-medium text-navy-300 ring-1 ring-white/5">
        No ranked games yet. Be the first to climb.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {entries.map((e) => (
        <li key={e.userId}>
          <Row entry={e} isSelf={e.userId === selfUserId} />
        </li>
      ))}
    </ol>
  );
}

function Row({
  entry,
  isSelf,
}: {
  entry: LeaderboardEntry;
  isSelf: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 ring-1 transition ${
        isSelf
          ? "bg-brand-lime/10 ring-brand-lime/40"
          : "bg-navy-900 ring-white/5 hover:bg-navy-800"
      }`}
    >
      <RankBadge rank={entry.rank} />
      <Avatar className="h-9 w-9 rounded-md border border-white/10">
        {entry.image ? (
          <AvatarImage src={entry.image} alt={entry.login} />
        ) : null}
        <AvatarFallback className="rounded-md bg-navy-700 text-[11px] font-bold text-white">
          {entry.login.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-white">
            {entry.login}
          </span>
          {isSelf && (
            <span className="rounded-full bg-brand-lime/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-lime">
              you
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-navy-300">
          <span>{entry.games} games</span>
          <span className="text-brand-lime">W {entry.wins}</span>
          <span className="text-brand-coral">L {entry.losses}</span>
          <span className="text-brand-amber">D {entry.draws}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[20px] font-bold tabular-nums text-white">
          {entry.rating}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-navy-400">
          rating
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const meta = rankMeta(rank);
  return (
    <span
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[13px] font-extrabold tabular-nums"
      style={{
        background: meta.bg,
        color: meta.color,
        boxShadow: meta.shadow,
      }}
    >
      {rank}
    </span>
  );
}

function rankMeta(rank: number): {
  bg: string;
  color: string;
  shadow: string;
} {
  if (rank === 1)
    return {
      bg: "linear-gradient(180deg,#f7d572 0%,#d8a92a 60%,#a07a14 100%)",
      color: "#3a2a06",
      shadow:
        "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.3)",
    };
  if (rank === 2)
    return {
      bg: "linear-gradient(180deg,#e0e3e8 0%,#a8aeb8 60%,#7a8090 100%)",
      color: "#2a2f3a",
      shadow:
        "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.3)",
    };
  if (rank === 3)
    return {
      bg: "linear-gradient(180deg,#d3996a 0%,#a06030 60%,#6a3e1c 100%)",
      color: "#3a1f0a",
      shadow:
        "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.3)",
    };
  return {
    bg: "var(--color-navy-800)",
    color: "var(--color-navy-200)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.25)",
  };
}
