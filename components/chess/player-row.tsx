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
}: PlayerRowProps) {
  return (
    <div className="flex items-center gap-3.5 px-2 py-3">
      <Avatar className="h-10 w-10 rounded-md border border-white/10">
        {image ? <AvatarImage src={image} alt={login} /> : null}
        <AvatarFallback className="rounded-md bg-navy-700 text-[12px] font-bold text-white">
          {login.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate text-[15px] font-semibold text-white">
          {login}
        </span>
        <span className="font-mono text-[12px] font-semibold text-navy-300">
          ({rating})
        </span>
        <CapturedRow pieces={captured} />
      </div>

      <div
        className={`ml-auto flex h-11 min-w-[96px] items-center justify-center rounded-md px-4 font-mono text-[20px] font-bold tabular-nums transition-colors ${
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
