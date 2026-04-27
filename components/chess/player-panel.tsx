import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChessClock } from "./chess-clock";
import { CapturedRow } from "./captured-row";

type PlayerPanelProps = {
  login: string;
  image?: string | null;
  rating: number;
  /** Optional descriptor shown next to the login (e.g. "You", "Opponent"). */
  badge?: string;
  /** Pieces this player has captured (rendered as glyphs). */
  captured: string[];
  /** Live milliseconds remaining for this player. Undefined → no clock shown. */
  clockMs?: number;
  /** Whether this player's clock is currently ticking. */
  active: boolean;
};

/**
 * Combined player line: avatar + login + captured pieces on the left, clock
 * on the right. Pulses a thin accent border when the player is on the move
 * so the active side reads at a glance.
 */
export function PlayerPanel({
  login,
  image,
  rating,
  badge,
  captured,
  clockMs,
  active,
}: PlayerPanelProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl bg-navy-850 px-4 py-3 ring-1 transition-colors ${
        active ? "ring-brand-lime/40" : "ring-white/5"
      }`}
    >
      <Avatar className="h-10 w-10 border border-white/10">
        {image ? <AvatarImage src={image} alt={login} /> : null}
        <AvatarFallback className="bg-navy-800 text-[12px] font-bold text-white">
          {login.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-white">
            {login}
          </span>
          <span className="font-mono text-[11px] text-navy-300">{rating}</span>
          {badge && (
            <span className="rounded-full bg-brand-lime/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-lime">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-1">
          <CapturedRow pieces={captured} />
        </div>
      </div>
      {clockMs !== undefined && (
        <div className="w-[110px]">
          <ChessClock ms={clockMs} active={active} />
        </div>
      )}
    </div>
  );
}
