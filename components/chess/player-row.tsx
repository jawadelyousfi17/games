import { WifiOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CapturedRow } from "./captured-row";

type PlayerRowProps = {
  login: string;
  image?: string | null;
  rating: number;
  /** Pieces captured BY this player (rendered as glyphs). */
  captured: string[];
  /** Live milliseconds remaining. Pre-formatted to keep this row stateless. */
  clockText: string;
  /** Whether this player is on the move. Brightens the clock chip. */
  active: boolean;
  /** Seconds left in the disconnect-grace window. null = connected. */
  graceSecondsLeft?: number | null;
};

/**
 * Compact player chip rendered above + below the board. Mirrors the
 * chess.com layout: avatar | login (rating) [captured] | clock pill.
 */
export function PlayerRow({
  login,
  image,
  rating,
  captured,
  clockText,
  active,
  graceSecondsLeft,
}: PlayerRowProps) {
  const disconnected =
    graceSecondsLeft !== null &&
    graceSecondsLeft !== undefined &&
    graceSecondsLeft >= 0;
  return (
    <div
      className={`flex items-center gap-3.5 px-2 py-3 transition-opacity ${
        disconnected ? "opacity-80" : ""
      }`}
    >
      <Avatar
        className={`h-10 w-10 rounded-md border ${
          disconnected ? "border-brand-coral/60" : "border-white/10"
        }`}
      >
        {image ? <AvatarImage src={image} alt={login} /> : null}
        <AvatarFallback className="rounded-md bg-navy-700 text-[12px] font-bold text-white">
          {login.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate text-[15px] font-semibold text-white">
          {login}
        </span>
        <span className="text-[12px] font-semibold text-navy-300">
          ({rating})
        </span>
        {disconnected ? (
          <DisconnectChip seconds={graceSecondsLeft} />
        ) : (
          <CapturedRow pieces={captured} />
        )}
      </div>

      <div
        className={`ml-auto flex h-11 min-w-[96px] items-center justify-center rounded-md px-4 text-[20px] font-bold tabular-nums transition-colors ${
          active
            ? "bg-white text-navy-900 shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
            : "bg-navy-800 text-navy-200 ring-1 ring-white/5"
        }`}
      >
        {clockText}
      </div>
    </div>
  );
}

/**
 * Red pulsing chip rendered next to a player's login while they're
 * disconnected, counting down the seconds until the auto-forfeit fires.
 */
function DisconnectChip({ seconds }: { seconds: number }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-brand-coral/15 px-2.5 ring-1 ring-brand-coral/40 animate-pulse">
      <WifiOff className="h-3 w-3 text-brand-coral" strokeWidth={2.5} />
      <span className="text-[11px] font-bold text-brand-coral">
        {seconds}s
      </span>
    </span>
  );
}
