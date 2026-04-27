import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChessClock } from "./chess-clock";
import { expectedWhiteScore } from "@/lib/chess/elo";

type Player = {
  login: string;
  image?: string | null;
  rating: number;
};

type MatchHeaderProps = {
  white: Player;
  black: Player;
  whiteMs: number;
  blackMs: number;
  whiteActive: boolean;
  blackActive: boolean;
  /** Time-control summary, e.g. "5+0 · Blitz". */
  timeControl: string;
  /** Whose perspective drives the "You" badge. */
  myColor: "w" | "b" | null;
};

/**
 * Match arena banner: white player on the left, black on the right, with a
 * win-probability bar between them that's computed from rating diff. Below
 * each player sits their live clock.
 *
 * The whole strip flips visually depending on whose perspective is loaded —
 * but the layout stays white-on-left / black-on-right for chess intuition.
 */
export function MatchHeader({
  white,
  black,
  whiteMs,
  blackMs,
  whiteActive,
  blackActive,
  timeControl,
  myColor,
}: MatchHeaderProps) {
  const whiteProb = expectedWhiteScore(white.rating, black.rating);
  const blackProb = 1 - whiteProb;

  return (
    <div className="rounded-3xl bg-navy-850/80 p-5 shadow-card-soft ring-1 ring-white/5 backdrop-blur">
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
        <PlayerSlot
          player={white}
          align="left"
          colorTag="WHITE"
          active={whiteActive}
          isMe={myColor === "w"}
        />

        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-300">
            VS
          </span>
          <span className="rounded-full bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-navy-200 ring-1 ring-white/5">
            {timeControl}
          </span>
        </div>

        <PlayerSlot
          player={black}
          align="right"
          colorTag="BLACK"
          active={blackActive}
          isMe={myColor === "b"}
        />
      </div>

      {/* Win-probability bar */}
      <div className="mt-5 flex h-2 overflow-hidden rounded-full ring-1 ring-white/5">
        <div
          className="h-full bg-white/85 transition-all duration-500"
          style={{ width: `${whiteProb * 100}%` }}
        />
        <div
          className="h-full bg-navy-700 transition-all duration-500"
          style={{ width: `${blackProb * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-navy-400">
        <span>{Math.round(whiteProb * 100)}%</span>
        <span>win prob</span>
        <span>{Math.round(blackProb * 100)}%</span>
      </div>

      {/* Live clocks under each player */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ChessClock ms={whiteMs} active={whiteActive} size="lg" />
        <ChessClock ms={blackMs} active={blackActive} size="lg" />
      </div>
    </div>
  );
}

function PlayerSlot({
  player,
  align,
  colorTag,
  active,
  isMe,
}: {
  player: Player;
  align: "left" | "right";
  colorTag: "WHITE" | "BLACK";
  active: boolean;
  isMe: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div className="relative">
        <Avatar
          className={`h-14 w-14 border-2 transition-all ${
            active
              ? "border-brand-lime shadow-[0_0_24px_rgba(198,242,78,0.45)]"
              : "border-white/10"
          }`}
        >
          {player.image ? (
            <AvatarImage src={player.image} alt={player.login} />
          ) : null}
          <AvatarFallback className="bg-navy-800 text-[14px] font-bold text-white">
            {player.login.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {active && (
          <span className="pulse-soft absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-brand-lime ring-2 ring-navy-850" />
        )}
      </div>

      <div className={align === "right" ? "items-end" : ""}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-navy-400">
            {colorTag}
          </span>
          {isMe && (
            <span className="rounded-full bg-brand-lime/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-lime">
              you
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[16px] font-bold text-white">
          {player.login}
        </div>
        <div className="font-mono text-[12px] text-navy-300">
          {player.rating}
        </div>
      </div>
    </div>
  );
}
