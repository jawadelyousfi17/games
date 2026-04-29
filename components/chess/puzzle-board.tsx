"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Lightbulb, RotateCcw, Check, X, ExternalLink, Shuffle } from "lucide-react";
import { BoardFrame } from "./board-frame";
import { useChessTheme } from "./use-chess-theme";
import { resolveCastlingTarget } from "@/lib/chess/castle";
import { playMoveSoundFromSan, preloadChessSounds } from "@/lib/chess/sound";
import type { Puzzle } from "@/lib/chess/puzzles-api";

type Status = "solving" | "wrong" | "solved";

type Props = {
  puzzle: Puzzle;
  /** Optional href for the "Next puzzle" button shown after solving. */
  nextHref?: string;
  /** When true, shows a "Next puzzle" button that calls router.refresh()
   *  to pull another puzzle from the server component. */
  showNext?: boolean;
};

/**
 * Solve-mode chess board. Loads a Lichess puzzle, accepts the user's moves
 * one at a time, plays the engine reply automatically. On a wrong move the
 * board reverts to the puzzle position so the user can retry.
 */
export function PuzzleBoard({ puzzle, nextHref, showNext }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { theme } = useChessTheme();
  const [chess, setChess] = useState(() => new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("solving");
  const [hint, setHint] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ square: string; fen: string } | null>(
    null,
  );
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-init when the puzzle prop changes (e.g. user navigates to next).
  useEffect(() => {
    console.info("[puzzle-board] mounted/updated", {
      id: puzzle.id,
      fen: puzzle.fen,
      sideToMove: puzzle.sideToMove,
      solutionLen: puzzle.solution.length,
    });
    const fresh = new Chess(puzzle.fen);
    setChess(fresh);
    setFen(puzzle.fen);
    setStep(0);
    setStatus("solving");
    setHint(null);
    setSelection(null);
  }, [puzzle.fen, puzzle.id, puzzle.sideToMove, puzzle.solution.length]);

  useEffect(() => {
    preloadChessSounds();
  }, []);

  const reset = useCallback(() => {
    const fresh = new Chess(puzzle.fen);
    setChess(fresh);
    setFen(puzzle.fen);
    setStep(0);
    setStatus("solving");
    setHint(null);
    setSelection(null);
  }, [puzzle.fen]);

  const playEngineReply = useCallback(
    (workingChess: Chess, atStep: number) => {
      const replyUci = puzzle.solution[atStep];
      if (!replyUci) return;
      const move = workingChess.move({
        from: replyUci.slice(0, 2),
        to: replyUci.slice(2, 4),
        promotion: replyUci.length >= 5 ? replyUci[4] : undefined,
      });
      if (!move) return;
      setFen(workingChess.fen());
      const verbose = workingChess.history();
      playMoveSoundFromSan(verbose[verbose.length - 1] ?? "", verbose.length - 1);
    },
    [puzzle.solution],
  );

  const tryUserMove = useCallback(
    (from: string, rawTo: string): boolean => {
      if (status !== "solving") return false;
      const expected = puzzle.solution[step];
      if (!expected) return false;

      const to = resolveCastlingTarget(chess, from, rawTo);
      const expectedFrom = expected.slice(0, 2);
      const expectedTo = expected.slice(2, 4);
      const expectedPromo = expected.length >= 5 ? expected[4] : undefined;

      // Apply the move to the live chess instance so it animates onto the
      // board even if it turns out to be wrong. We undo it later instead of
      // refusing the drop — feedback is clearer when the piece actually
      // moves before the "wrong" callout.
      const move = chess.move({
        from,
        to,
        promotion: expectedPromo ?? "q",
      });
      if (!move) return false;

      setFen(chess.fen());
      const sanList = chess.history();
      playMoveSoundFromSan(
        sanList[sanList.length - 1] ?? "",
        sanList.length - 1,
      );
      setSelection(null);

      const matches = from === expectedFrom && to === expectedTo;
      if (!matches) {
        // Wrong move: keep it visible for ~700ms, then undo just this one
        // ply so the user retries from the same position (their earlier
        // correct moves stay applied).
        setStatus("wrong");
        setHint(null);
        if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
        wrongTimeoutRef.current = setTimeout(() => {
          chess.undo();
          setFen(chess.fen());
          setStatus("solving");
        }, 700);
        return true;
      }

      setHint(null);
      const nextStep = step + 1;
      if (nextStep < puzzle.solution.length) {
        setStep(nextStep + 1);
        setTimeout(() => {
          playEngineReply(chess, nextStep);
        }, 350);
      } else {
        setStep(nextStep);
        setStatus("solved");
      }
      return true;
    },
    [chess, puzzle.solution, step, status, playEngineReply],
  );

  const onPieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!targetSquare) return false;
      return tryUserMove(sourceSquare, targetSquare);
    },
    [tryUserMove],
  );

  const onSquareClick = useCallback(
    ({
      square,
      piece,
    }: {
      square: string;
      piece: { pieceType: string } | null;
    }) => {
      if (status !== "solving") return;
      const selected =
        selection && selection.fen === fen ? selection.square : null;
      if (selected) {
        const legal: string[] = chess
          .moves({ square: selected as Square, verbose: true })
          .map((m) => m.to);
        const resolved = resolveCastlingTarget(chess, selected, square);
        if (legal.includes(square) || legal.includes(resolved)) {
          tryUserMove(selected, square);
          return;
        }
      }
      if (piece && piece.pieceType[0]?.toLowerCase() === chess.turn()) {
        setSelection({ square, fen });
        return;
      }
      setSelection(null);
    },
    [chess, fen, selection, status, tryUserMove],
  );

  const onHint = useCallback(() => {
    const expected = puzzle.solution[step];
    if (!expected) return;
    setHint(expected.slice(0, 2));
  }, [puzzle.solution, step]);

  const orientation: "white" | "black" =
    puzzle.sideToMove === "b" ? "black" : "white";

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const out: Record<string, React.CSSProperties> = {};
    if (status === "wrong") {
      // Tint the user's own pieces' starting squares red. Cheap visual cue.
      out["a1"] = { background: "rgba(214,90,90,0.25)" };
    }
    const selected =
      selection && selection.fen === fen ? selection.square : null;
    if (selected) {
      out[selected] = {
        background: theme.lastMove,
        boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.55)",
      };
      const verbose = chess.moves({
        square: selected as Square,
        verbose: true,
      });
      for (const m of verbose) {
        out[m.to] = {
          ...(out[m.to] ?? {}),
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.35) 18%, transparent 22%)",
        };
      }
    }
    if (hint) {
      out[hint] = {
        ...(out[hint] ?? {}),
        boxShadow: "inset 0 0 0 4px rgba(129,182,76,0.85)",
      };
    }
    return out;
  }, [chess, fen, selection, status, hint, theme.lastMove]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 p-6">
      <PuzzleHeader puzzle={puzzle} status={status} />

      <div className="aspect-square w-full max-w-[560px]">
        <BoardFrame>
          <Chessboard
            options={{
              position: fen,
              onPieceDrop,
              onSquareClick,
              boardOrientation: orientation,
              allowDragging: status === "solving",
              animationDurationInMs: 200,
              darkSquareStyle: { backgroundColor: theme.dark },
              lightSquareStyle: { backgroundColor: theme.light },
              squareStyles,
              boardStyle: { borderRadius: 0 },
            }}
          />
        </BoardFrame>
      </div>

      <PuzzleControls
        status={status}
        onReset={reset}
        onHint={onHint}
        nextHref={nextHref}
        showNext={showNext}
        nextPending={isPending}
        onNext={() => startTransition(() => router.refresh())}
        externalUrl={puzzle.externalUrl}
      />
    </div>
  );
}

function PuzzleHeader({
  puzzle,
  status,
}: {
  puzzle: Puzzle;
  status: Status;
}) {
  const turnLabel =
    puzzle.sideToMove === "w" ? "White to move" : "Black to move";
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-2 text-white">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-navy-300">
        Puzzle · {puzzle.rating} Elo
      </div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight">
          {status === "solved"
            ? "Solved"
            : status === "wrong"
              ? "Try again"
              : turnLabel}
        </h1>
        <span className="text-[12px] text-navy-300">
          {puzzle.themes.slice(0, 3).join(" · ")}
        </span>
      </div>
      <StatusChip status={status} />
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  if (status === "solved") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-brand-lime/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-lime">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        Correct
      </span>
    );
  }
  if (status === "wrong") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-brand-coral/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-coral">
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        Wrong move
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-200">
      Find the best move
    </span>
  );
}

function PuzzleControls({
  status,
  onReset,
  onHint,
  nextHref,
  showNext,
  nextPending,
  onNext,
  externalUrl,
}: {
  status: Status;
  onReset: () => void;
  onHint: () => void;
  nextHref?: string;
  showNext?: boolean;
  nextPending?: boolean;
  onNext?: () => void;
  externalUrl: string;
}) {
  return (
    <div className="flex w-full max-w-[560px] flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onHint}
        disabled={status !== "solving"}
        className="btn-3d-dark flex h-10 items-center gap-2 rounded-md px-3.5 text-[13px] font-semibold text-white ring-1 ring-white/10 disabled:opacity-50"
      >
        <Lightbulb className="h-4 w-4" strokeWidth={2.25} />
        Hint
      </button>
      <button
        type="button"
        onClick={onReset}
        className="btn-3d-dark flex h-10 items-center gap-2 rounded-md px-3.5 text-[13px] font-semibold text-white ring-1 ring-white/10"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.25} />
        Reset
      </button>
      {showNext && onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextPending}
          className="btn-3d-dark flex h-10 items-center gap-2 rounded-md px-3.5 text-[13px] font-semibold text-white ring-1 ring-white/10 disabled:opacity-50"
        >
          <Shuffle className="h-4 w-4" strokeWidth={2.25} />
          {nextPending ? "Loading…" : "Next puzzle"}
        </button>
      )}
      <a
        href={externalUrl}
        target="_blank"
        rel="noreferrer"
        className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-navy-300 hover:text-white"
      >
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
        On Lichess
      </a>
      {nextHref && status === "solved" && (
        <a
          href={nextHref}
          className="btn-3d-lime flex h-10 items-center justify-center rounded-md px-4 text-[13px] font-bold text-navy-950"
        >
          Next puzzle
        </a>
      )}
    </div>
  );
}
