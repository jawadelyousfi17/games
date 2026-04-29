"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { RightRail } from "./right-rail";
import { MobileGameBar } from "./mobile-game-bar";
import { GameActionBar } from "./game-action-bar";
import { BoardFrame } from "./board-frame";
import { GameEndDialog } from "./game-end-dialog";
import { useGameReview } from "./use-game-review";
import { useChessTheme } from "./use-chess-theme";
import { CapturedRow } from "./captured-row";
import { deriveCaptured } from "@/lib/chess/captured";
import { resolveCastlingTarget } from "@/lib/chess/castle";
import type { ChessEndReasonValue } from "@/lib/chess/realtime";
import {
  playGameEndSound,
  playMoveSoundFromSan,
  playOpeningSound,
  preloadChessSounds,
} from "@/lib/chess/sound";

const TURN_LABEL: Record<"w" | "b", string> = {
  w: "White to move",
  b: "Black to move",
};

/** Selection bound to the FEN at click time. Becomes inert when the position
 *  changes (e.g. on undo/reset) without needing a setState-in-effect. */
type Selection = { square: string; fen: string } | null;

/**
 * Local pass-and-play board. Same layout shell as the online game (mobile
 * bar, board, right rail) so the design stays consistent. After the game
 * ends the user can walk through past positions via the move-nav.
 */
export function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [selection, setSelection] = useState<Selection>(null);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  /** -1 = starting pos, 0..N-1 = after that ply, null = follow live state. */
  const [viewingPly, setViewingPly] = useState<number | null>(null);
  const { theme } = useChessTheme();

  // chess.js mutates `game` in place; bumping `fen` is enough to invalidate
  // memos that depend on the live position.
  const history = useMemo(
    () => game.history(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, fen],
  );
  const captured = useMemo(() => deriveCaptured(history), [history]);
  const review = useGameReview(history);
  const isOver = game.isCheckmate() || game.isStalemate() || game.isDraw();

  // Auto-jump into review mode when the game ends.
  useEffect(() => {
    if (isOver && viewingPly === null && history.length > 0) {
      setViewingPly(history.length - 1);
    }
  }, [isOver, viewingPly, history.length]);

  // -------- Game-end dialog + sound --------
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const endTriggeredRef = useRef(false);
  const endInfo = useMemo(
    () => deriveLocalEnd(game),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, fen],
  );
  useEffect(() => {
    if (!isOver || endTriggeredRef.current) return;
    endTriggeredRef.current = true;
    setEndDialogOpen(true);
    playGameEndSound(endInfo.reason);
  }, [isOver, endInfo.reason]);
  // Reset the end-dialog trigger when the user starts a fresh game.
  useEffect(() => {
    if (!isOver) endTriggeredRef.current = false;
  }, [isOver]);

  // -------- Move sound effects --------
  useEffect(() => {
    preloadChessSounds();
  }, []);

  // Plays the opening cue when a fresh game begins. Tied to `game` identity
  // so the "New game" button (which swaps in a new Chess instance) replays
  // the fanfare. Skips when an undo brings us back to ply 0 in-game.
  const openedForGameRef = useRef<Chess | null>(null);
  useEffect(() => {
    if (openedForGameRef.current !== game && history.length === 0) {
      openedForGameRef.current = game;
      playOpeningSound();
    }
  }, [game, history.length]);

  const lastHistoryLenRef = useRef(history.length);
  useEffect(() => {
    const len = history.length;
    if (len > lastHistoryLenRef.current) {
      const san = history[len - 1];
      if (san) playMoveSoundFromSan(san, len - 1);
    }
    lastHistoryLenRef.current = len;
  }, [history]);

  // -------- Review walk-through --------
  const isLiveView = viewingPly === null;
  const currentPly = viewingPly ?? history.length - 1;

  const seek = useCallback(
    (ply: number) => {
      const clamped = Math.max(-1, Math.min(history.length - 1, ply));
      setViewingPly(
        clamped === history.length - 1 && !isOver ? null : clamped,
      );
    },
    [history.length, isOver],
  );

  // Prefer the authoritative live fen when at the last ply or live, so a
  // rebuilt-from-history FEN can never visually rewind the board after a
  // mating move.
  const atLastPly = currentPly === history.length - 1;
  const displayFen =
    isLiveView || atLastPly
      ? fen
      : (review.positions.fens[currentPly + 1] ?? fen);
  const displayLastMove =
    isLiveView || atLastPly
      ? lastMove
      : currentPly >= 0
        ? review.positions.moves[currentPly]
        : null;
  const displayChess = useMemo(
    () => (isLiveView || atLastPly ? game : new Chess(displayFen)),
    [isLiveView, atLastPly, game, displayFen],
  );

  const selected =
    selection && selection.fen === fen ? selection.square : null;

  const executeMove = useCallback(
    (from: string, rawTo: string): boolean => {
      try {
        const to = resolveCastlingTarget(game, from, rawTo);
        const move = game.move({ from, to, promotion: "q" });
        if (!move) return false;
        setFen(game.fen());
        setLastMove({ from: move.from, to: move.to });
        setSelection(null);
        return true;
      } catch {
        return false;
      }
    },
    [game],
  );

  const onPieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!targetSquare || isOver || !isLiveView) return false;
      return executeMove(sourceSquare, targetSquare);
    },
    [isOver, isLiveView, executeMove],
  );

  const onSquareClick = useCallback(
    ({
      square,
      piece,
    }: {
      square: string;
      piece: { pieceType: string } | null;
    }) => {
      if (isOver || !isLiveView) return;
      if (selected) {
        const legal: string[] = game
          .moves({ square: selected as Square, verbose: true })
          .map((m) => m.to);
        const resolved = resolveCastlingTarget(game, selected, square);
        if (legal.includes(square) || legal.includes(resolved)) {
          executeMove(selected, square);
          return;
        }
      }
      if (piece && piece.pieceType[0]?.toLowerCase() === game.turn()) {
        setSelection({ square, fen });
        return;
      }
      setSelection(null);
    },
    [game, isOver, isLiveView, selected, executeMove, fen],
  );

  const reset = useCallback(() => {
    const fresh = new Chess();
    setGame(fresh);
    setFen(fresh.fen());
    setLastMove(null);
    setSelection(null);
    setViewingPly(null);
  }, []);

  const undo = useCallback(() => {
    game.undo();
    setFen(game.fen());
    const verbose = game.history({ verbose: true });
    const last = verbose[verbose.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
    setSelection(null);
  }, [game]);

  const onFlipBoard = useCallback(() => {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const out: Record<string, React.CSSProperties> = {};
    if (displayLastMove) {
      out[displayLastMove.from] = { background: theme.lastMove };
      out[displayLastMove.to] = { background: theme.lastMove };
    }
    if (displayChess.inCheck()) {
      const kingSq = findKingSquare(displayChess, displayChess.turn());
      if (kingSq) out[kingSq] = { background: theme.check };
    }
    if (isLiveView && selected) {
      out[selected] = {
        ...(out[selected] ?? {}),
        background: theme.lastMove,
        boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.55)",
      };
      const verbose = displayChess.moves({
        square: selected as Square,
        verbose: true,
      });
      const targets = new Set<string>(verbose.map((m) => m.to));
      // Highlight own-rook squares too so users who castle by dragging the
      // king onto the rook see it as a legal target.
      for (const m of verbose) {
        if (m.isKingsideCastle()) {
          targets.add(m.to[0] === "g" ? `h${m.to[1]}` : m.to);
        } else if (m.isQueensideCastle()) {
          targets.add(m.to[0] === "c" ? `a${m.to[1]}` : m.to);
        }
      }
      for (const t of targets) {
        out[t] = {
          ...(out[t] ?? {}),
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.35) 18%, transparent 22%)",
        };
      }
    }
    return out;
  }, [displayLastMove, theme.lastMove, theme.check, displayChess, selected, isLiveView]);

  const turnLabel = isOver ? "Game over" : TURN_LABEL[game.turn()];

  return (
    <div className="relative h-screen">
      <div className="flex h-full flex-col p-6 xl:pr-[444px] 2xl:pr-[584px]">
        <MobileGameBar
          history={history}
          banner={turnLabel}
          onFlipBoard={onFlipBoard}
          review={review}
          currentPly={currentPly}
          onSeek={seek}
        />
        <SimplePlayerRow
          label={orientation === "white" ? "Black" : "White"}
          captured={
            orientation === "white" ? captured.black : captured.white
          }
          active={!isOver && game.turn() === (orientation === "white" ? "b" : "w")}
        />

        <div className="flex min-h-0 flex-1 items-center justify-center py-2">
          <BoardFrame>
            <Chessboard
              options={{
                position: displayFen,
                onPieceDrop,
                onSquareClick,
                allowDragging: !isOver && isLiveView,
                animationDurationInMs: 200,
                darkSquareStyle: { backgroundColor: theme.dark },
                lightSquareStyle: { backgroundColor: theme.light },
                squareStyles,
                boardOrientation: orientation,
                boardStyle: { borderRadius: 0 },
              }}
            />
          </BoardFrame>
        </div>

        <SimplePlayerRow
          label={orientation === "white" ? "White" : "Black"}
          captured={
            orientation === "white" ? captured.white : captured.black
          }
          active={!isOver && game.turn() === (orientation === "white" ? "w" : "b")}
        />

        <div className="flex items-center justify-between px-1 pt-2">
          <GameActionBar />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={undo}
              disabled={history.length === 0}
            >
              Undo
            </Button>
            <Button type="button" onClick={reset}>
              New game
            </Button>
          </div>
        </div>
      </div>

      <GameEndDialog
        open={endDialogOpen}
        onOpenChange={setEndDialogOpen}
        outcome={endInfo.outcome}
        reason={endInfo.reason}
        title={endInfo.title}
        qualities={review.qualities}
        playerColor={endInfo.playerColor}
        newGameHref="/games/chess/play/local"
        newGameLabel="New game"
      />

      <aside className="fixed right-0 top-0 hidden h-screen border-l border-white/5 xl:flex xl:w-[420px] 2xl:w-[560px]">
        <RightRail
          history={history}
          banner={turnLabel}
          onFlipBoard={onFlipBoard}
          review={review}
          currentPly={currentPly}
          onSeek={seek}
        />
      </aside>
    </div>
  );
}

function SimplePlayerRow({
  label,
  captured,
  active,
}: {
  label: string;
  captured: string[];
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-md text-[12px] font-bold ${
          active ? "bg-white text-navy-900" : "bg-navy-700 text-white"
        }`}
      >
        {label[0]}
      </div>
      <span className="text-[13px] font-semibold text-white">{label}</span>
      <CapturedRow pieces={captured} />
    </div>
  );
}

/**
 * Maps a chess.js terminal state to the GameEndDialog inputs. For local
 * pass-and-play we don't have a "you" perspective, so winner-side titles
 * read more naturally than "You won". `playerColor` resolves to the
 * winner's color when there is one — it filters the stat row to that side.
 */
function deriveLocalEnd(game: Chess): {
  outcome: "win" | "loss" | "draw";
  reason: ChessEndReasonValue | null;
  title: string;
  playerColor: "w" | "b" | null;
} {
  if (game.isCheckmate()) {
    // turn() returns the side that's mated; the other side is the winner.
    const winnerColor: "w" | "b" = game.turn() === "w" ? "b" : "w";
    const winnerLabel = winnerColor === "w" ? "White" : "Black";
    return {
      outcome: "win",
      reason: "CHECKMATE",
      title: `${winnerLabel} Won`,
      playerColor: winnerColor,
    };
  }
  if (game.isStalemate())
    return { outcome: "draw", reason: "STALEMATE", title: "Draw", playerColor: null };
  if (game.isInsufficientMaterial())
    return { outcome: "draw", reason: "DRAW_INSUFFICIENT", title: "Draw", playerColor: null };
  if (game.isThreefoldRepetition())
    return { outcome: "draw", reason: "DRAW_THREEFOLD", title: "Draw", playerColor: null };
  if (game.isDraw())
    return { outcome: "draw", reason: "DRAW_FIFTY_MOVE", title: "Draw", playerColor: null };
  return { outcome: "draw", reason: null, title: "Game over", playerColor: null };
}

function findKingSquare(game: Chess, color: "w" | "b"): string | null {
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = board[r][f];
      if (cell?.type === "k" && cell.color === color) {
        return `${"abcdefgh"[f]}${8 - r}`;
      }
    }
  }
  return null;
}
