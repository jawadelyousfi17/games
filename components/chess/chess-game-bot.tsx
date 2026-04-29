"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Bot, Flag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RightRail } from "./right-rail";
import { MobileGameBar } from "./mobile-game-bar";
import { GameActionBar } from "./game-action-bar";
import { BoardFrame } from "./board-frame";
import { GameEndDialog } from "./game-end-dialog";
import { useGameReview } from "./use-game-review";
import { useChessTheme } from "./use-chess-theme";
import { useStockfish } from "./use-stockfish";
import { CapturedRow } from "./captured-row";
import { deriveCaptured } from "@/lib/chess/captured";
import { resolveCastlingTarget } from "@/lib/chess/castle";
import { isPromotionMove, type PromotionPiece } from "@/lib/chess/promotion";
import { PromotionPicker } from "./promotion-picker";
import { BOT_LEVELS, resolveBotLevel, type BotLevelId } from "@/lib/chess/bot-levels";
import { saveBotReview } from "@/lib/chess/bot-review-storage";
import type { ChessEndReasonValue, GameStatePayload } from "@/lib/chess/realtime";
import {
  playGameEndSound,
  playMoveSoundFromSan,
  playOpeningSound,
  preloadChessSounds,
} from "@/lib/chess/sound";

type Selection = { square: string; fen: string } | null;

type Props = {
  initialLevel?: BotLevelId;
  /** "white" = human plays white. */
  initialSide?: "white" | "black";
};

/**
 * Single-player chess against Stockfish. The board lives client-side; the
 * engine runs in the same Web Worker we use for review. Each level pins a
 * UCI Skill Level + depth + movetime cap so weak levels actually play
 * weakly instead of just slowly.
 */
export function ChessGameBot({
  initialLevel = 2,
  initialSide = "white",
}: Props) {
  const [levelId, setLevelId] = useState<BotLevelId>(initialLevel);
  const [humanSide, setHumanSide] = useState<"white" | "black">(initialSide);
  const level = useMemo(() => resolveBotLevel(levelId), [levelId]);
  const humanColor: "w" | "b" = humanSide === "white" ? "w" : "b";
  const botColor: "w" | "b" = humanColor === "w" ? "b" : "w";

  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [selection, setSelection] = useState<Selection>(null);
  const [viewingPly, setViewingPly] = useState<number | null>(null);
  const [promotion, setPromotion] = useState<{
    from: string;
    to: string;
    color: "w" | "b";
  } | null>(null);
  /** Set when the human resigns. Forces an immediate end-state with a
   *  RESIGN reason so the user can jump straight to the review. */
  const [resigned, setResigned] = useState(false);
  const { theme } = useChessTheme();
  const { status: engineStatus, analyze } = useStockfish();

  const history = useMemo(
    () => game.history(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, fen],
  );
  const captured = useMemo(() => deriveCaptured(history), [history]);
  const review = useGameReview(history);
  const isOver =
    resigned ||
    game.isCheckmate() ||
    game.isStalemate() ||
    game.isDraw();
  const isBotTurn = !isOver && game.turn() === botColor;
  const [botThinking, setBotThinking] = useState(false);

  // Reset when the player changes side or level — fresh game keeps the
  // record honest (level changes mid-game would skew stats).
  const reset = useCallback(() => {
    const fresh = new Chess();
    setGame(fresh);
    setFen(fresh.fen());
    setLastMove(null);
    setSelection(null);
    setViewingPly(null);
    setResigned(false);
  }, []);

  const onResign = useCallback(() => {
    if (isOver) return;
    if (typeof window !== "undefined" && !window.confirm("Resign this game?")) {
      return;
    }
    setResigned(true);
  }, [isOver]);

  useEffect(() => {
    reset();
  }, [levelId, humanSide, reset]);

  // Auto-jump to review on game end.
  useEffect(() => {
    if (isOver && viewingPly === null && history.length > 0) {
      setViewingPly(history.length - 1);
    }
  }, [isOver, viewingPly, history.length]);

  // Sounds.
  useEffect(() => {
    preloadChessSounds();
  }, []);
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

  // -------- End dialog --------
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const endTriggeredRef = useRef(false);
  const endInfo = useMemo(
    () => deriveBotEnd(game, humanColor, resigned),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, fen, humanColor, resigned],
  );
  useEffect(() => {
    if (!isOver || endTriggeredRef.current) return;
    endTriggeredRef.current = true;
    setEndDialogOpen(true);
    playGameEndSound(endInfo.reason);
    // Stash the finished game so the dedicated /review page can render the
    // walk-through. Bot games aren't persisted server-side, so sessionStorage
    // is the carrier.
    saveBotReview({
      id: "bot",
      white:
        humanColor === "w"
          ? { id: "you", login: "You", image: null, rating: 0 }
          : { id: "bot", login: `Stockfish · ${level.label}`, image: null, rating: level.approxElo },
      black:
        humanColor === "b"
          ? { id: "you", login: "You", image: null, rating: 0 }
          : { id: "bot", login: `Stockfish · ${level.label}`, image: null, rating: level.approxElo },
      myColor: humanColor,
      state: buildBotGameStatePayload({
        fen: game.fen(),
        history: game.history(),
        lastMove,
        outcome: endInfo.outcome,
        reason: endInfo.reason,
        humanColor,
      }),
      finished: true,
      botLabel: `Stockfish · ${level.label}`,
    });
  }, [isOver, endInfo.reason, endInfo.outcome, game, lastMove, humanColor, level]);
  useEffect(() => {
    if (!isOver) endTriggeredRef.current = false;
  }, [isOver]);

  // -------- Bot move loop --------
  // Triggered every time the position changes. If it's the bot's turn and the
  // engine is ready, request a move, pad the response with a minimum think
  // time so the bot doesn't snap back instantly, then apply the move.
  // Cancellation flag prevents a stale response from landing after a reset.
  useEffect(() => {
    if (!isBotTurn || engineStatus !== "ready") return;
    let cancelled = false;
    setBotThinking(true);
    const startedAt = Date.now();
    void (async () => {
      const result = await analyze(fen, {
        skillLevel: level.skill,
        depth: level.depth,
        movetimeMs: level.movetimeMs,
      });
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, level.minThinkMs - elapsed);
      if (wait > 0) {
        await new Promise<void>((r) => setTimeout(r, wait));
      }
      if (cancelled) return;
      setBotThinking(false);
      if (!result?.bestMove) return;
      const { from, to, promotion } = parseUci(result.bestMove);
      try {
        const move = game.move({ from, to, promotion: promotion ?? "q" });
        if (move) {
          setFen(game.fen());
          setLastMove({ from: move.from, to: move.to });
        }
      } catch {
        /* engine produced an illegal move — extremely rare; ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isBotTurn, engineStatus, fen, game, level, analyze]);

  // -------- Review walk-through --------
  const isLiveView = viewingPly === null;
  const currentPly = viewingPly ?? history.length - 1;
  const seek = useCallback(
    (ply: number) => {
      const clamped = Math.max(-1, Math.min(history.length - 1, ply));
      setViewingPly(clamped === history.length - 1 && !isOver ? null : clamped);
    },
    [history.length, isOver],
  );

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

  // -------- Human move handling --------
  const selected = selection && selection.fen === fen ? selection.square : null;
  const canHumanMove =
    !isOver && !botThinking && isLiveView && game.turn() === humanColor;

  const commitMove = useCallback(
    (from: string, to: string, promotionPiece: PromotionPiece): boolean => {
      try {
        const move = game.move({ from, to, promotion: promotionPiece });
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

  const executeMove = useCallback(
    (from: string, rawTo: string): boolean => {
      const to = resolveCastlingTarget(game, from, rawTo);
      if (isPromotionMove(game, from, to)) {
        setPromotion({ from, to, color: game.turn() });
        return true;
      }
      return commitMove(from, to, "q");
    },
    [game, commitMove],
  );

  const onPieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!targetSquare || !canHumanMove) return false;
      return executeMove(sourceSquare, targetSquare);
    },
    [canHumanMove, executeMove],
  );

  const onSquareClick = useCallback(
    ({
      square,
      piece,
    }: {
      square: string;
      piece: { pieceType: string } | null;
    }) => {
      if (!canHumanMove) return;
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
    [game, canHumanMove, selected, executeMove, fen],
  );

  // Undo the last full round-trip (human + bot) so the human gets a do-over
  // without ending up with the bot to move on a fresh ply.
  const undo = useCallback(() => {
    if (botThinking) return;
    // Bot just moved → roll back two plies. Otherwise (human just moved and
    // bot hasn't responded yet) roll back one.
    const popCount = game.turn() === humanColor && history.length >= 2 ? 2 : 1;
    for (let i = 0; i < popCount; i++) {
      game.undo();
    }
    setFen(game.fen());
    const verbose = game.history({ verbose: true });
    const last = verbose[verbose.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
    setSelection(null);
  }, [game, botThinking, humanColor, history.length]);

  const onFlipBoard = useCallback(() => {
    setHumanSide((s) => (s === "white" ? "black" : "white"));
  }, []);

  // -------- Square highlights --------
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

  // -------- Layout projections --------
  const orientation = humanSide;
  const turnLabel = isOver
    ? "Game over"
    : botThinking
      ? `Bot thinking · ${level.label}`
      : game.turn() === humanColor
        ? "Your move"
        : `${level.label} to move`;

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

        <BotHeader
          level={level.label}
          approxElo={level.approxElo}
          captured={
            humanSide === "white" ? captured.black : captured.white
          }
          botActive={botThinking || (!isOver && game.turn() === botColor)}
        />

        <div className="flex min-h-0 flex-1 items-center justify-center py-2">
          <BoardFrame>
            <Chessboard
              options={{
                position: displayFen,
                onPieceDrop,
                onSquareClick,
                allowDragging: canHumanMove,
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

        <YouRow
          captured={
            humanSide === "white" ? captured.white : captured.black
          }
          active={!isOver && game.turn() === humanColor}
        />

        <BotControls
          levelId={levelId}
          onLevelChange={setLevelId}
          onSwitchSides={onFlipBoard}
          onReset={reset}
          onUndo={undo}
          onResign={onResign}
          canUndo={history.length > 0 && !botThinking}
          canResign={!isOver && history.length > 0}
          engineStatus={engineStatus}
        />

        <GameActionBar />
      </div>

      <PromotionPicker
        open={promotion !== null}
        color={promotion?.color ?? "w"}
        onPick={(piece) => {
          if (!promotion) return;
          commitMove(promotion.from, promotion.to, piece);
          setPromotion(null);
        }}
        onCancel={() => setPromotion(null)}
      />

      <GameEndDialog
        open={endDialogOpen}
        onOpenChange={setEndDialogOpen}
        outcome={endInfo.outcome}
        reason={endInfo.reason}
        title={endInfo.title}
        qualities={review.qualities}
        playerColor={humanColor}
        newGameLabel="New game"
        reviewHref="/games/chess/play/bot/review"
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

function BotHeader({
  level,
  approxElo,
  captured,
  botActive,
}: {
  level: string;
  approxElo: number;
  captured: string[];
  botActive: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          botActive ? "bg-white text-navy-900" : "bg-navy-700 text-white"
        }`}
      >
        <Bot className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-white">
          Stockfish · {level}
        </span>
        <span className="text-[11px] text-navy-300">~{approxElo} Elo</span>
      </div>
      <CapturedRow pieces={captured} />
    </div>
  );
}

function YouRow({
  captured,
  active,
}: {
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
        Y
      </div>
      <span className="text-[13px] font-semibold text-white">You</span>
      <CapturedRow pieces={captured} />
    </div>
  );
}

function BotControls({
  levelId,
  onLevelChange,
  onSwitchSides,
  onReset,
  onUndo,
  onResign,
  canUndo,
  canResign,
  engineStatus,
}: {
  levelId: BotLevelId;
  onLevelChange: (id: BotLevelId) => void;
  onSwitchSides: () => void;
  onReset: () => void;
  onUndo: () => void;
  onResign: () => void;
  canUndo: boolean;
  canResign: boolean;
  engineStatus: "loading" | "ready" | "error";
}) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex items-center gap-1.5 rounded-md bg-navy-800 p-1 ring-1 ring-white/5">
        {BOT_LEVELS.map((l) => {
          const active = l.id === levelId;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onLevelChange(l.id)}
              title={l.blurb}
              className={`flex h-9 flex-1 flex-col items-center justify-center rounded text-[11px] font-semibold transition ${
                active
                  ? "bg-white/[0.08] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]"
                  : "text-navy-300 hover:text-white"
              }`}
            >
              <span>{l.label}</span>
              <span className="text-[9px] text-navy-400">{l.approxElo}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-navy-400">
          {engineStatus === "loading" && "Loading engine…"}
          {engineStatus === "error" && "Engine failed to load."}
          {engineStatus === "ready" && "Engine ready."}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onSwitchSides}
          >
            Switch sides
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onUndo}
            disabled={!canUndo}
          >
            Undo
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onResign}
            disabled={!canResign}
          >
            <Flag className="h-4 w-4" strokeWidth={2.25} />
            Resign
          </Button>
          <Button type="button" onClick={onReset}>
            <RotateCcw className="h-4 w-4" strokeWidth={2.25} />
            New game
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildBotGameStatePayload(args: {
  fen: string;
  history: string[];
  lastMove: { from: string; to: string } | null;
  outcome: "win" | "loss" | "draw";
  reason: ChessEndReasonValue | null;
  humanColor: "w" | "b";
}): GameStatePayload {
  const result: GameStatePayload["result"] =
    args.outcome === "draw"
      ? "DRAW"
      : args.outcome === "win"
        ? args.humanColor === "w"
          ? "WHITE_WIN"
          : "BLACK_WIN"
        : args.humanColor === "w"
          ? "BLACK_WIN"
          : "WHITE_WIN";
  return {
    fen: args.fen,
    status: "COMPLETED",
    result,
    endReason: args.reason,
    whiteMs: 0,
    blackMs: 0,
    lastMoveAt: new Date().toISOString(),
    history: args.history,
    lastMove: args.lastMove,
    drawOfferedBy: null,
  };
}

function parseUci(uci: string): {
  from: string;
  to: string;
  promotion?: string;
} {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length >= 5 ? uci[4] : undefined,
  };
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

function deriveBotEnd(
  game: Chess,
  humanColor: "w" | "b",
  resigned: boolean,
): {
  outcome: "win" | "loss" | "draw";
  reason: ChessEndReasonValue | null;
  title: string;
  playerColor: "w" | "b" | null;
} {
  if (resigned) {
    return {
      outcome: "loss",
      reason: "RESIGN",
      title: "You resigned",
      playerColor: humanColor,
    };
  }
  if (game.isCheckmate()) {
    const winnerColor: "w" | "b" = game.turn() === "w" ? "b" : "w";
    const humanWon = winnerColor === humanColor;
    return {
      outcome: humanWon ? "win" : "loss",
      reason: "CHECKMATE",
      title: humanWon ? "You won" : "Bot won",
      playerColor: humanColor,
    };
  }
  if (game.isStalemate())
    return { outcome: "draw", reason: "STALEMATE", title: "Draw", playerColor: humanColor };
  if (game.isInsufficientMaterial())
    return { outcome: "draw", reason: "DRAW_INSUFFICIENT", title: "Draw", playerColor: humanColor };
  if (game.isThreefoldRepetition())
    return { outcome: "draw", reason: "DRAW_THREEFOLD", title: "Draw", playerColor: humanColor };
  if (game.isDraw())
    return { outcome: "draw", reason: "DRAW_FIFTY_MOVE", title: "Draw", playerColor: humanColor };
  return { outcome: "draw", reason: null, title: "Game over", playerColor: humanColor };
}
