"use client";

import Link from "next/link";
import { Star, ThumbsUp, AlertCircle, BookOpen, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChessEndReasonValue } from "@/lib/chess/realtime";
import type { Quality } from "@/lib/chess/move-quality";

type Outcome = "win" | "loss" | "draw";

type GameEndDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outcome: Outcome;
  reason: ChessEndReasonValue | null;
  /** Headline override. Defaults to "You won" / "You lost" / "Draw". */
  title?: string;
  /** Per-ply quality classifications used to render the stat row. */
  qualities?: Array<Quality | null>;
  /** When provided, the stat counts only include this color's moves. White
   *  plays even plies (0, 2, 4…), black plays odd. Pass null to count both
   *  sides (e.g., a spectator view). */
  playerColor?: "w" | "b" | null;
  /** Where the secondary "New game" button navigates. */
  newGameHref?: string;
  /** Label for the "New game" button. Mirrors the time control by default. */
  newGameLabel?: string;
  /** Callback for the Rematch button. Disabled when omitted. */
  onRematch?: () => void;
  /** When "pending", the button shows a waiting label instead of "Rematch".
   *  When "declined", reverts to "Rematch" but keeps a hint above. */
  rematchState?: "idle" | "pending" | "declined";
  /** When set, the "Game Review" CTA navigates to this URL instead of just
   *  closing the dialog. */
  reviewHref?: string;
};

const REASON_TEXT: Record<ChessEndReasonValue, string> = {
  CHECKMATE: "by checkmate",
  RESIGN: "by resignation",
  TIMEOUT: "on time",
  STALEMATE: "by stalemate",
  DRAW_INSUFFICIENT: "by insufficient material",
  DRAW_THREEFOLD: "by threefold repetition",
  DRAW_FIFTY_MOVE: "by 50-move rule",
  DRAW_AGREED: "by agreement",
  ABORT: "game aborted",
  DISCONNECT: "opponent left the game",
};

const COACH_LINE: Record<Outcome, string> = {
  win: "Nice game! Let's review your moves together and lock in what worked.",
  loss: "That game didn't go your way, but don't sweat it. Let's review it together and learn how to improve.",
  draw: "Even game. Let's walk through it and see where it could have tipped.",
};

const HEADLINE: Record<Outcome, string> = {
  win: "You Won",
  loss: "You Lost",
  draw: "Draw",
};

/**
 * chess.com-style end-of-game dialog. Dark header strip with the result,
 * coach speech bubble below, stat tiles for Best / Excellent / Mistakes
 * derived from the live engine review, and a green primary CTA to enter the
 * walk-through review.
 */
export function GameEndDialog({
  open,
  onOpenChange,
  outcome,
  reason,
  title,
  qualities,
  playerColor,
  newGameHref = "/games/chess",
  newGameLabel = "New game",
  onRematch,
  rematchState = "idle",
  reviewHref,
}: GameEndDialogProps) {
  const headline = title ?? HEADLINE[outcome];
  const reasonText = reason ? REASON_TEXT[reason] : "";
  const stats = countStats(qualities ?? [], playerColor ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden border-white/10 bg-navy-900 p-0 text-white sm:max-w-[480px]"
        showCloseButton={false}
      >
        {/* Header bar */}
        <div className="relative bg-black/45 px-6 py-5 text-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-navy-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-[28px] font-extrabold tracking-tight">
              {headline}
            </DialogTitle>
            {reasonText && (
              <DialogDescription className="text-[14px] font-medium text-navy-300">
                {reasonText}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 pb-6 pt-5">
          <div className="flex items-end gap-3">
            <CoachAvatar outcome={outcome} />
            <SpeechBubble>{COACH_LINE[outcome]}</SpeechBubble>
          </div>

          <div className="grid grid-cols-4 gap-2 px-1 pt-1">
            <StatTile
              Icon={Star}
              count={stats.best}
              label="Best"
              accent="#81b64c"
            />
            <StatTile
              Icon={ThumbsUp}
              count={stats.good}
              label="Excellent"
              accent="#9ec96f"
            />
            <StatTile
              Icon={BookOpen}
              count={stats.book}
              label="Book"
              accent="#a08864"
            />
            <StatTile
              Icon={AlertCircle}
              count={stats.mistakes}
              label="Mistakes"
              accent="#e08a3c"
            />
          </div>

          {reviewHref ? (
            <Link
              href={reviewHref}
              className="flex h-14 w-full items-center justify-center rounded-md bg-brand-lime text-[18px] font-extrabold text-navy-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.22)] transition hover:bg-brand-lime-light active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
            >
              Game Review
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-14 w-full items-center justify-center rounded-md bg-brand-lime text-[18px] font-extrabold text-navy-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.22)] transition hover:bg-brand-lime-light active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
            >
              Game Review
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={newGameHref}
              className="flex h-12 items-center justify-center rounded-md bg-navy-800 text-[14px] font-semibold text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
            >
              {newGameLabel}
            </Link>
            <button
              type="button"
              onClick={onRematch}
              disabled={!onRematch || rematchState === "pending"}
              className="flex h-12 items-center justify-center rounded-md bg-navy-800 text-[14px] font-semibold text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rematchState === "pending" ? "Waiting…" : "Rematch"}
            </button>
          </div>
          {rematchState === "declined" && (
            <p className="text-center text-[12px] text-brand-coral">
              Opponent declined the rematch.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CoachAvatar({ outcome }: { outcome: Outcome }) {
  // Tinted circular tile with a chess-piece glyph as the "coach" mascot.
  // Different glyph per outcome keeps the avatar from looking generic.
  const config: Record<Outcome, { bg: string; glyph: string }> = {
    win: { bg: "linear-gradient(160deg, #6a9a3e, #3f6326)", glyph: "♚" },
    loss: { bg: "linear-gradient(160deg, #5a4a2a, #2c2418)", glyph: "♞" },
    draw: { bg: "linear-gradient(160deg, #7a6230, #3f3216)", glyph: "♛" },
  };
  const c = config[outcome];
  return (
    <div
      className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-white/10"
      style={{ background: c.bg }}
    >
      <span className="text-[34px] leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
        {c.glyph}
      </span>
    </div>
  );
}

function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 rounded-2xl bg-white px-4 py-3 text-[14px] font-medium leading-snug text-navy-900">
      {/* Tail pointing at the avatar on the left */}
      <span
        aria-hidden="true"
        className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 bg-white"
      />
      {children}
    </div>
  );
}

function StatTile({
  Icon,
  count,
  label,
  accent,
}: {
  Icon: typeof Star;
  count: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: accent }}
        >
          <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
        </span>
        <span className="text-[18px] font-extrabold" style={{ color: accent }}>
          {count}
        </span>
      </div>
      <span className="text-[12px] font-bold" style={{ color: accent }}>
        {label}
      </span>
    </div>
  );
}

/**
 * Tally the move-quality buckets, optionally filtering to one color's plies.
 * White plays even-indexed plies, black plays odd. Passing `playerColor =
 * null` counts both sides — used for spectator/local views.
 */
function countStats(
  qualities: Array<Quality | null>,
  playerColor: "w" | "b" | null,
) {
  let best = 0;
  let good = 0;
  let book = 0;
  let mistakes = 0;
  for (let i = 0; i < qualities.length; i++) {
    if (playerColor === "w" && i % 2 !== 0) continue;
    if (playerColor === "b" && i % 2 !== 1) continue;
    const q = qualities[i];
    if (!q) continue;
    if (q === "book") book++;
    else if (q === "best") best++;
    else if (q === "good") good++;
    else if (q === "inaccuracy" || q === "mistake" || q === "blunder")
      mistakes++;
  }
  return { best, good, book, mistakes };
}
