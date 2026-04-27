"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { ChessStatus } from "@/types/chess";
import type { GameStatePayload } from "@/lib/chess/realtime";
import { PlayerRow } from "./player-row";
import { RightRail } from "./right-rail";
import { GameActionBar } from "./game-action-bar";
import { ResultBanner } from "./result-banner";
import { useChessTheme } from "./use-chess-theme";
import { deriveCaptured } from "@/lib/chess/captured";
import { makeChessMove } from "@/actions/games/chess/make-move";
import { resignChessGame } from "@/actions/games/chess/resign";
import { claimChessTimeout } from "@/actions/games/chess/claim-timeout";
import { getChessGame } from "@/actions/games/chess/get-game";
import type { GameSnapshot } from "@/actions/games/chess/get-game";

type ChessGameOnlineProps = {
  snapshot: GameSnapshot;
};

const POLL_INTERVAL_MS = 1500;

export function ChessGameOnline({ snapshot }: ChessGameOnlineProps) {
  const [state, setState] = useState<GameStatePayload>(snapshot.state);
  const [selected, setSelected] = useState<string | null>(null);
  /** Override the natural perspective. null = follow snapshot.myColor. */
  const [orientationOverride, setOrientationOverride] = useState<
    "white" | "black" | null
  >(null);
  const { theme } = useChessTheme();

  const game = useMemo(() => new Chess(state.fen), [state.fen]);
  const status = useMemo<ChessStatus>(
    () => deriveStatus(game, state),
    [game, state],
  );
  const captured = useMemo(() => deriveCaptured(state.history), [state.history]);

  const isFinished = state.status !== "IN_PROGRESS";
  const myColor = snapshot.myColor;
  const isMyTurn = !isFinished && myColor !== null && game.turn() === myColor;

  // -------- Polling --------
  const lastSeenRef = useRef(state.lastMoveAt);
  useEffect(() => {
    lastSeenRef.current = state.lastMoveAt;
  }, [state.lastMoveAt]);

  useEffect(() => {
    if (isFinished) return;
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const fresh = await getChessGame(snapshot.id);
        if (cancelled) return;
        if (
          fresh.state.lastMoveAt !== lastSeenRef.current ||
          fresh.state.status !== "IN_PROGRESS"
        ) {
          setState(fresh.state);
        }
      } catch {
        /* swallow — next tick retries */
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [snapshot.id, isFinished]);

  // -------- Live clock countdown --------
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (isFinished) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [isFinished]);

  const elapsed = isFinished
    ? 0
    : Math.max(0, now - new Date(state.lastMoveAt).getTime());
  const liveWhiteMs =
    game.turn() === "w" ? Math.max(0, state.whiteMs - elapsed) : state.whiteMs;
  const liveBlackMs =
    game.turn() === "b" ? Math.max(0, state.blackMs - elapsed) : state.blackMs;

  const claimingRef = useRef(false);
  useEffect(() => {
    if (isFinished || claimingRef.current) return;
    const expired = game.turn() === "w" ? liveWhiteMs <= 0 : liveBlackMs <= 0;
    if (!expired) return;
    claimingRef.current = true;
    claimChessTimeout(snapshot.id).finally(() => {
      claimingRef.current = false;
    });
  }, [snapshot.id, isFinished, game, liveWhiteMs, liveBlackMs]);

  useEffect(() => {
    setSelected(null);
  }, [state.fen]);

  // -------- Move execution --------
  const executeMove = useCallback(
    (from: string, to: string): boolean => {
      const trial = new Chess(state.fen);
      const move = trial.move({ from, to, promotion: "q" });
      if (!move) return false;

      setState((prev) => ({
        ...prev,
        fen: trial.fen(),
        lastMove: { from, to },
      }));
      setSelected(null);

      void makeChessMove({
        gameId: snapshot.id,
        from,
        to,
        promotion: "q",
      }).then(async () => {
        try {
          const fresh = await getChessGame(snapshot.id);
          setState(fresh.state);
        } catch {
          /* ignore */
        }
      });
      return true;
    },
    [state.fen, snapshot.id],
  );

  const onPieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!targetSquare || !isMyTurn) return false;
      return executeMove(sourceSquare, targetSquare);
    },
    [isMyTurn, executeMove],
  );

  const onSquareClick = useCallback(
    ({
      square,
      piece,
    }: {
      square: string;
      piece: { pieceType: string } | null;
    }) => {
      if (!isMyTurn) return;

      if (selected) {
        const moves: string[] = game
          .moves({ square: selected as Square, verbose: true })
          .map((m) => m.to);
        if (moves.includes(square)) {
          executeMove(selected, square);
          return;
        }
      }

      if (piece && pieceBelongsTo(piece.pieceType, myColor)) {
        setSelected(square);
        return;
      }
      setSelected(null);
    },
    [game, isMyTurn, selected, myColor, executeMove],
  );

  const onResign = useCallback(async () => {
    if (isFinished) return;
    if (typeof window !== "undefined" && !window.confirm("Resign this game?")) {
      return;
    }
    await resignChessGame(snapshot.id);
    try {
      const fresh = await getChessGame(snapshot.id);
      setState(fresh.state);
    } catch {
      /* ignore */
    }
  }, [snapshot.id, isFinished]);

  const onFlipBoard = useCallback(() => {
    setOrientationOverride((prev) => {
      const naturalWhite = myColor !== "b";
      const current = prev ?? (naturalWhite ? "white" : "black");
      return current === "white" ? "black" : "white";
    });
  }, [myColor]);

  // -------- Square highlighting --------
  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const out: Record<string, React.CSSProperties> = {};
    if (state.lastMove) {
      out[state.lastMove.from] = { background: theme.lastMove };
      out[state.lastMove.to] = { background: theme.lastMove };
    }
    if (game.inCheck()) {
      const kingSq = findKingSquare(game, game.turn());
      if (kingSq) out[kingSq] = { background: theme.check };
    }
    if (selected) {
      out[selected] = {
        ...(out[selected] ?? {}),
        background: theme.lastMove,
        boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.55)",
      };
      const targets = game
        .moves({ square: selected as Square, verbose: true })
        .map((m) => m.to);
      for (const t of targets) {
        out[t] = {
          ...(out[t] ?? {}),
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.35) 18%, transparent 22%)",
        };
      }
    }
    return out;
  }, [state.lastMove, theme.lastMove, theme.check, game, selected]);

  // -------- Layout projections --------
  const orientation: "white" | "black" =
    orientationOverride ?? (myColor === "b" ? "black" : "white");
  const banner = isFinished ? buildResultBanner(state, myColor) : null;

  // Top row in the layout always represents the player at the top of the
  // board — the side opposite the orientation. Bottom row = orientation side.
  const topIsWhite = orientation === "black";
  const topPlayer = topIsWhite ? snapshot.white : snapshot.black;
  const bottomPlayer = topIsWhite ? snapshot.black : snapshot.white;
  const topCaptured = topIsWhite ? captured.white : captured.black;
  const bottomCaptured = topIsWhite ? captured.black : captured.white;
  const topClock = topIsWhite ? liveWhiteMs : liveBlackMs;
  const bottomClock = topIsWhite ? liveBlackMs : liveWhiteMs;
  const topActive =
    !isFinished && (topIsWhite ? game.turn() === "w" : game.turn() === "b");
  const bottomActive = !isFinished && !topActive;

  const moveCount = state.history.length;
  const railBanner =
    moveCount === 0
      ? "Waiting for white's first move…"
      : `Move ${Math.ceil(moveCount / 2)} · ${moveCount} ply`;

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0">
      {/* Center column: board + player rows + actions */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PlayerRow
          login={topPlayer.login}
          image={topPlayer.image}
          rating={topPlayer.rating}
          captured={topCaptured}
          clockText={formatClock(topClock)}
          active={topActive}
        />

        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,calc(100vh-12rem))] overflow-hidden ring-1 ring-white/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
          <Chessboard
            options={{
              position: state.fen,
              onPieceDrop,
              onSquareClick,
              boardOrientation: orientation,
              allowDragging: isMyTurn,
              animationDurationInMs: 200,
              darkSquareStyle: { backgroundColor: theme.dark },
              lightSquareStyle: { backgroundColor: theme.light },
              squareStyles,
              boardStyle: { borderRadius: 0 },
            }}
          />
        </div>

        <PlayerRow
          login={bottomPlayer.login}
          image={bottomPlayer.image}
          rating={bottomPlayer.rating}
          captured={bottomCaptured}
          clockText={formatClock(bottomClock)}
          active={bottomActive}
        />

        <GameActionBar
          disabled={isFinished || myColor === null}
          onResign={myColor && !isFinished ? onResign : undefined}
        />

        {banner && (
          <div className="mt-3">
            <ResultBanner
              title={banner.title}
              subtitle={banner.subtitle}
              tone={banner.tone}
            />
          </div>
        )}
      </div>

      {/* Right rail */}
      <div className="hidden w-[380px] flex-shrink-0 border-l border-white/5 lg:flex">
        <RightRail
          history={state.history}
          banner={railBanner}
          onFlipBoard={onFlipBoard}
        />
      </div>
    </div>
  );
}

function deriveStatus(game: Chess, state: GameStatePayload): ChessStatus {
  if (state.status === "COMPLETED" || state.status === "ABANDONED") {
    if (state.result === "WHITE_WIN") return { kind: "checkmate", winner: "w" };
    if (state.result === "BLACK_WIN") return { kind: "checkmate", winner: "b" };
    if (state.result === "DRAW") return { kind: "draw", reason: "other" };
  }
  if (game.isCheckmate()) {
    return { kind: "checkmate", winner: game.turn() === "w" ? "b" : "w" };
  }
  if (game.isStalemate()) return { kind: "stalemate" };
  return { kind: "turn", color: game.turn(), inCheck: game.inCheck() };
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

function pieceBelongsTo(pieceType: string, color: "w" | "b" | null): boolean {
  if (!color) return false;
  return pieceType[0]?.toLowerCase() === color;
}

function buildResultBanner(
  state: GameStatePayload,
  myColor: "w" | "b" | null,
): { title: string; subtitle?: string; tone: "win" | "loss" | "draw" } {
  if (state.result === "DRAW") {
    return { title: "Draw", tone: "draw" };
  }
  const winnerColor = state.result === "WHITE_WIN" ? "w" : "b";
  if (myColor === null) {
    return {
      title: winnerColor === "w" ? "White wins" : "Black wins",
      tone: "draw",
    };
  }
  const won = winnerColor === myColor;
  return {
    title: won ? "You won." : "You lost.",
    tone: won ? "win" : "loss",
  };
}

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) {
    const seconds = Math.floor(clamped / 1000);
    const tenths = Math.floor((clamped % 1000) / 100);
    return `${seconds}.${tenths}`;
  }
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
