import type { RatingSummary } from "@/actions/games/chess/get-rating";

type RatingCardProps = {
  summary: RatingSummary;
};

/** Compact rating + record card for the chess lobby. */
export function RatingCard({ summary }: RatingCardProps) {
  return (
    <div className="rounded-2xl bg-navy-850 p-5 ring-1 ring-white/5">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-navy-400">
        Rating
      </div>
      <div className="text-[36px] font-extrabold leading-none text-white">
        {summary.rating}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[12px] text-navy-300">
        <span>{summary.games} games</span>
        <span className="text-brand-lime">W {summary.wins}</span>
        <span className="text-brand-coral">L {summary.losses}</span>
        <span className="text-brand-amber">D {summary.draws}</span>
      </div>
    </div>
  );
}
