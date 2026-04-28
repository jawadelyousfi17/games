"use client";

import { useCallback, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import {
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  FlipVertical2,
} from "lucide-react";
import { BoardFrame } from "./board-frame";
import { MoveList } from "./move-list";
import { ReviewCommentary } from "./review-commentary";
import { ReviewStatus } from "./review-status";
import { ThemePicker } from "./theme-picker";
import { useChessTheme } from "./use-chess-theme";
import { useGameReview } from "./use-game-review";
import { uciToSan } from "@/lib/chess/uci-to-san";
import type { GameSnapshot } from "@/actions/games/chess/get-game";

type GameReviewPageProps = {
  snapshot: GameSnapshot;
};

/**
 * Dedicated game-review experience. Loads after a game is finished and lets
 * the user step through every position with engine commentary on each move
 * (classification, the move played, the engine's preferred move, eval).
 */
export function GameReviewClient({ snapshot }: GameReviewPageProps) {
  const review = useGameReview(snapshot.state.history);
  const { theme, setThemeId, themes } = useChessTheme();

  const total = snapshot.state.history.length;
  const [currentPly, setCurrentPly] = useState<number>(total - 1);
  const [orientation, setOrientation] = useState<"white" | "black">(
    snapshot.myColor === "b" ? "black" : "white",
  );

  const seek = useCallback(
    (ply: number) => {
      setCurrentPly(Math.max(-1, Math.min(total - 1, ply)));
    },
    [total],
  );

  const fen =
    review.positions.fens[currentPly + 1] ?? review.positions.fens[0];
  const lastMove =
    currentPly >= 0 ? review.positions.moves[currentPly] : null;

  // Highlight the engine's preferred move on the board (translucent green
  // arrow). Implemented as a square overlay: from + to squares get a tint.
  const bestUci =
    currentPly >= -1
      ? review.bestMoves[review.positions.fens[currentPly + 1]] ?? null
      : null;
  const bestPreviewUci = currentPly >= 0
    ? review.bestMoves[review.positions.fens[currentPly]] ?? null
    : null;
  // Best move for the position currently shown is `bestUci`. To highlight
  // what the player should have played at the previous step we use
  // `bestPreviewUci`.
  void bestUci; // not used directly today but kept for future arrow overlays

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const out: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      out[lastMove.from] = { background: theme.lastMove };
      out[lastMove.to] = { background: theme.lastMove };
    }
    if (bestPreviewUci && bestPreviewUci.length >= 4) {
      const from = bestPreviewUci.slice(0, 2);
      const to = bestPreviewUci.slice(2, 4);
      // Only show suggestion when the player didn't already play it.
      const playedSame =
        lastMove && lastMove.from === from && lastMove.to === to;
      if (!playedSame) {
        out[from] = {
          ...(out[from] ?? {}),
          boxShadow: "inset 0 0 0 3px rgba(129,182,76,0.85)",
        };
        out[to] = {
          ...(out[to] ?? {}),
          boxShadow: "inset 0 0 0 3px rgba(129,182,76,0.85)",
        };
      }
    }
    return out;
  }, [lastMove, theme.lastMove, bestPreviewUci]);

  const onFlip = useCallback(() => {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

  const opponent =
    snapshot.myColor === "w" ? snapshot.black : snapshot.white;
  const me = snapshot.myColor === "w" ? snapshot.white : snapshot.black;
  const headerLine = snapshot.myColor
    ? `${me.login} (${me.rating}) vs ${opponent.login} (${opponent.rating})`
    : `${snapshot.white.login} vs ${snapshot.black.login}`;

  const stats = useMemo(() => countStats(review.qualities), [review.qualities]);

  return (
    <div className="relative h-screen">
      <div className="flex h-full flex-col p-6 xl:pr-[584px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-navy-300">
              Game Review
            </div>
            <div className="mt-0.5 text-[16px] font-bold text-white">
              {headerLine}
            </div>
          </div>
          <ReviewStatus
            status={review.status}
            analyzed={review.analyzed}
            total={review.total}
          />
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center py-2">
          <BoardFrame>
            <Chessboard
              options={{
                position: fen,
                allowDragging: false,
                boardOrientation: orientation,
                animationDurationInMs: 200,
                darkSquareStyle: { backgroundColor: theme.dark },
                lightSquareStyle: { backgroundColor: theme.light },
                squareStyles,
                boardStyle: { borderRadius: 0 },
              }}
            />
          </BoardFrame>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <NavBtn
            label="Start"
            Icon={SkipBack}
            disabled={currentPly <= -1}
            onClick={() => seek(-1)}
          />
          <NavBtn
            label="Previous"
            Icon={ChevronLeft}
            disabled={currentPly <= -1}
            onClick={() => seek(currentPly - 1)}
          />
          <NavBtn
            label="Next"
            Icon={ChevronRight}
            disabled={currentPly >= total - 1}
            onClick={() => seek(currentPly + 1)}
          />
          <NavBtn
            label="End"
            Icon={SkipForward}
            disabled={currentPly >= total - 1}
            onClick={() => seek(total - 1)}
          />
          <span className="mx-2 h-6 w-px bg-white/10" />
          <NavBtn label="Flip board" Icon={FlipVertical2} onClick={onFlip} />
        </div>
      </div>

      <aside className="fixed right-0 top-0 hidden h-screen w-[560px] flex-col border-l border-white/5 bg-navy-900 xl:flex">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="text-[14px] font-semibold text-white">Review</div>
          <ThemePicker themes={themes} active={theme} onSelect={setThemeId} />
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-white/5 p-5">
          <Stat label="Best" count={stats.best} color="#81b64c" />
          <Stat label="Excellent" count={stats.good} color="#9ec96f" />
          <Stat label="Mistakes" count={stats.mistakes} color="#e08a3c" />
        </div>

        <div className="border-b border-white/5 p-5">
          <ReviewCommentary review={review} currentPly={currentPly} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <MoveList
            history={snapshot.state.history}
            qualities={review.qualities}
            currentPly={currentPly}
            onSeek={seek}
          />
        </div>
      </aside>
    </div>
  );
}

function NavBtn({
  label,
  Icon,
  onClick,
  disabled,
}: {
  label: string;
  Icon: typeof SkipBack;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-12 items-center justify-center rounded-md bg-navy-800 text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:text-navy-400 disabled:opacity-60"
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
    </button>
  );
}

function Stat({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-navy-850 py-3 ring-1 ring-white/5">
      <span className="text-[22px] font-extrabold" style={{ color }}>
        {count}
      </span>
      <span className="text-[11px] font-bold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function countStats(qualities: Array<unknown>) {
  let best = 0;
  let good = 0;
  let mistakes = 0;
  for (const q of qualities) {
    if (!q) continue;
    if (q === "best") best++;
    else if (q === "good") good++;
    else if (q === "inaccuracy" || q === "mistake" || q === "blunder")
      mistakes++;
  }
  return { best, good, mistakes };
}

// uciToSan re-exported here so the page-level imports stay tidy in case it's
// needed elsewhere.
export { uciToSan };
