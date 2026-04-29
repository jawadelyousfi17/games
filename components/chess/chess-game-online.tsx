"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { io, type Socket } from "socket.io-client";
import type {
  ChatMessagePayload,
  ChessEndReasonValue,
  GameStatePayload,
} from "@/lib/chess/realtime";
import { PlayerRow } from "./player-row";
import { RightRail } from "./right-rail";
import { MobileGameBar } from "./mobile-game-bar";
import { GameActionBar } from "./game-action-bar";
import { DrawOfferPrompt } from "./draw-offer-prompt";
import { ResultBanner } from "./result-banner";
import { BoardFrame } from "./board-frame";
import { GameEndDialog } from "./game-end-dialog";
import { useGameReview } from "./use-game-review";
import {
  playGameEndSound,
  playMoveSoundFromSan,
  playOpeningSound,
  preloadChessSounds,
} from "@/lib/chess/sound";
import { useChessTheme } from "./use-chess-theme";
import { deriveCaptured } from "@/lib/chess/captured";
import { resolveCastlingTarget } from "@/lib/chess/castle";
import { makeChessMove } from "@/actions/games/chess/make-move";
import { resignChessGame } from "@/actions/games/chess/resign";
import { claimChessTimeout } from "@/actions/games/chess/claim-timeout";
import { getChessGame } from "@/actions/games/chess/get-game";
import { offerDraw } from "@/actions/games/chess/offer-draw";
import { acceptDraw } from "@/actions/games/chess/accept-draw";
import { declineDraw } from "@/actions/games/chess/decline-draw";
import { requestChessRematch } from "@/actions/games/chess/request-rematch";
import { getChessChatMessages } from "@/actions/games/chess/get-chat-messages";
import { sendChessChatMessage } from "@/actions/games/chess/send-chat-message";
import type { GameSnapshot } from "@/actions/games/chess/get-game";

type ChessGameOnlineProps = {
  snapshot: GameSnapshot;
};

// Slow-cadence fallback for missed broadcasts. Realtime delivery is
// best-effort; the polling tick reconciles state if a websocket message
// dropped or the user reconnected mid-game.
const POLL_INTERVAL_MS = 8000;

/** Selection bound to the FEN it was made on. When state.fen changes from
 *  underneath us (e.g. opponent moved), the binding becomes stale and we
 *  treat the selection as cleared without needing a setState-in-effect. */
type Selection = { square: string; fen: string } | null;

export function ChessGameOnline({ snapshot }: ChessGameOnlineProps) {
  const [state, setState] = useState<GameStatePayload>(snapshot.state);
  const [selection, setSelection] = useState<Selection>(null);
  const [orientationOverride, setOrientationOverride] = useState<
    "white" | "black" | null
  >(null);
  /** -1 = starting pos, 0..N-1 = after that ply, null = follow live state. */
  const [viewingPly, setViewingPly] = useState<number | null>(null);
  const { theme } = useChessTheme();

  const game = useMemo(() => new Chess(state.fen), [state.fen]);
  const captured = useMemo(() => deriveCaptured(state.history), [state.history]);
  const review = useGameReview(state.history);

  // Selected square only counts if the FEN it was bound to is still current.
  const selected = selection && selection.fen === state.fen ? selection.square : null;

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

  // -------- Realtime subscription (Socket.IO) --------
  /** Opponent's grace deadline (epoch ms) when they're disconnected. */
  const [opponentGraceUntil, setOpponentGraceUntil] = useState<number | null>(
    null,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);

  // Initial chat fetch — once on mount, before the socket subscribes.
  useEffect(() => {
    let cancelled = false;
    void getChessChatMessages(snapshot.id)
      .then((rows) => {
        if (!cancelled) setChatMessages(rows);
      })
      .catch(() => {
        /* ignore — empty list is a fine starting state */
      });
    return () => {
      cancelled = true;
    };
  }, [snapshot.id]);

  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    socket.on("connect", () => {
      console.info("[chess] socket connected", socket.id);
      socket.emit("join", snapshot.id);
    });
    socket.on("connect_error", (err) =>
      console.warn("[chess] socket connect_error", err.message),
    );
    socket.on("disconnect", (reason) =>
      console.info("[chess] socket disconnected", reason),
    );
    socket.on("state", (payload: GameStatePayload) => {
      setState((prev) =>
        new Date(payload.lastMoveAt) >= new Date(prev.lastMoveAt)
          ? payload
          : prev,
      );
    });
    socket.on(
      "presence",
      (payload: {
        userId: string;
        present: boolean;
        graceUntil: number | null;
      }) => {
        const opponentId =
          snapshot.myColor === "w"
            ? snapshot.black.id
            : snapshot.myColor === "b"
              ? snapshot.white.id
              : null;
        if (!opponentId || payload.userId !== opponentId) return;
        setOpponentGraceUntil(payload.present ? null : payload.graceUntil);
      },
    );
    socket.on("chat", (payload: ChatMessagePayload) => {
      setChatMessages((prev) =>
        prev.some((m) => m.id === payload.id) ? prev : [...prev, payload],
      );
    });

    return () => {
      try {
        socket.emit("leave", snapshot.id);
        socket.disconnect();
      } catch {
        /* ignore */
      }
    };
  }, [snapshot.id, snapshot.myColor, snapshot.white.id, snapshot.black.id]);

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

  // -------- Review walk-through --------
  // When the game ends, jump to the final ply automatically so the user lands
  // in review mode. Until then, viewingPly stays null = live.
  useEffect(() => {
    if (isFinished && viewingPly === null && state.history.length > 0) {
      setViewingPly(state.history.length - 1);
    }
  }, [isFinished, viewingPly, state.history.length]);

  // -------- Game-end dialog + sound --------
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const endTriggeredRef = useRef(false);
  useEffect(() => {
    if (!isFinished || endTriggeredRef.current) return;
    endTriggeredRef.current = true;
    setEndDialogOpen(true);
    playGameEndSound(state.endReason);
  }, [isFinished, state.endReason]);

  // -------- Move sound effects --------
  // Preload mp3s on mount so the first move plays without a fetch hiccup.
  // Also fires the opening cue when joining a fresh game (no moves yet).
  const openingPlayedRef = useRef(false);
  useEffect(() => {
    preloadChessSounds();
    if (!openingPlayedRef.current && state.history.length === 0 && !isFinished) {
      openingPlayedRef.current = true;
      playOpeningSound();
    }
    // Intentionally empty deps — fires once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plays the move cue when the history grows. Initialized to the current
  // length so reconnect-mid-game doesn't replay every prior move's sound.
  const lastHistoryLenRef = useRef(state.history.length);
  useEffect(() => {
    const len = state.history.length;
    if (len > lastHistoryLenRef.current) {
      const san = state.history[len - 1];
      if (san) playMoveSoundFromSan(san, len - 1);
    }
    lastHistoryLenRef.current = len;
  }, [state.history]);

  const isLiveView = viewingPly === null;
  const currentPly = viewingPly ?? state.history.length - 1;
  const seek = useCallback(
    (ply: number) => {
      const clamped = Math.max(-1, Math.min(state.history.length - 1, ply));
      // If user clicked the last ply, snap back to live (drag/click re-enabled).
      setViewingPly(
        clamped === state.history.length - 1 && !isFinished ? null : clamped,
      );
    },
    [state.history.length, isFinished],
  );

  // When viewing the last ply (or live), prefer the authoritative state.fen
  // so we don't accidentally swap it for a rebuilt FEN that differs by a
  // halfmove counter — react-chessboard would animate that as a "rewind".
  const atLastPly = currentPly === state.history.length - 1;
  const displayFen =
    isLiveView || atLastPly
      ? state.fen
      : (review.positions.fens[currentPly + 1] ?? state.fen);
  const displayLastMove =
    isLiveView || atLastPly
      ? state.lastMove
      : currentPly >= 0
        ? review.positions.moves[currentPly]
        : null;
  const displayChess = useMemo(
    () =>
      isLiveView || atLastPly ? game : new Chess(displayFen),
    [isLiveView, atLastPly, game, displayFen],
  );

  // -------- Move execution --------
  const executeMove = useCallback(
    (from: string, rawTo: string): boolean => {
      const trial = new Chess(state.fen);
      const to = resolveCastlingTarget(trial, from, rawTo);
      const move = trial.move({ from, to, promotion: "q" });
      if (!move) return false;

      // Detect terminal locally so the end-of-game dialog fires the instant
      // the mover sees their move land — no waiting for the server round-
      // trip + broadcast. The server is still authoritative; its emit will
      // overwrite this with identical values once it commits.
      const optimisticTerminal = detectTerminal(trial, myColor);

      setState((prev) => ({
        ...prev,
        fen: trial.fen(),
        lastMove: { from, to },
        history: [...prev.history, move.san],
        ...(optimisticTerminal ?? {}),
      }));
      setSelection(null);

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
      if (!isMyTurn || !isLiveView) return;

      if (selected) {
        const moves: string[] = game
          .moves({ square: selected as Square, verbose: true })
          .map((m) => m.to);
        const resolved = resolveCastlingTarget(game, selected, square);
        if (moves.includes(square) || moves.includes(resolved)) {
          executeMove(selected, square);
          return;
        }
      }

      if (piece && pieceBelongsTo(piece.pieceType, myColor)) {
        setSelection({ square, fen: state.fen });
        return;
      }
      setSelection(null);
    },
    [game, isMyTurn, isLiveView, selected, myColor, executeMove, state.fen],
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

  // -------- Rematch --------
  const [rematchState, setRematchState] = useState<
    "idle" | "pending" | "declined"
  >("idle");
  const rematchChallengeIdRef = useRef<string | null>(null);

  const onRematch = useCallback(async () => {
    if (rematchState === "pending") return;
    setRematchState("pending");
    const res = await requestChessRematch(snapshot.id);
    if (!res.ok || !res.challengeId) {
      setRematchState("idle");
      return;
    }
    rematchChallengeIdRef.current = res.challengeId;
    // ACCEPTED routes both players via the global IncomingChallengeBanner
    // socket listener. DECLINED/EXPIRED/CANCELLED is surfaced here below.
  }, [rematchState, snapshot.id]);

  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });
    socket.on(
      "challenge:resolved",
      (payload: {
        challengeId: string;
        status: "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
      }) => {
        if (payload.challengeId !== rematchChallengeIdRef.current) return;
        if (payload.status === "ACCEPTED") return; // banner handles routing
        setRematchState("declined");
        rematchChallengeIdRef.current = null;
      },
    );
    return () => {
      socket.disconnect();
    };
  }, []);

  const onOfferDraw = useCallback(async () => {
    if (isFinished) return;
    await offerDraw(snapshot.id);
    // Server emits new state via socket; nothing else to do here.
  }, [snapshot.id, isFinished]);

  const onAcceptDraw = useCallback(async () => {
    await acceptDraw(snapshot.id);
  }, [snapshot.id]);

  const onDeclineDraw = useCallback(async () => {
    await declineDraw(snapshot.id);
  }, [snapshot.id]);

  const selfUserId =
    myColor === "w"
      ? snapshot.white.id
      : myColor === "b"
        ? snapshot.black.id
        : null;
  const onSendChatMessage = useCallback(
    async (body: string) => {
      await sendChessChatMessage(snapshot.id, body);
      // The server emits a `chat` socket event after insert; our listener
      // appends the message, so no manual setState needed here.
    },
    [snapshot.id],
  );

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
  }, [
    displayLastMove,
    theme.lastMove,
    theme.check,
    displayChess,
    selected,
    isLiveView,
  ]);

  // -------- Layout projections --------
  const orientation: "white" | "black" =
    orientationOverride ?? (myColor === "b" ? "black" : "white");
  const banner = isFinished ? buildResultBanner(state, myColor) : null;

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

  // Compute the opponent's grace seconds remaining. The 100ms tick that
  // already drives the clock countdown also drives this — `now` is set by
  // that interval, so the chip animates without an extra timer.
  const opponentGraceSecondsLeft =
    opponentGraceUntil !== null
      ? Math.max(0, Math.ceil((opponentGraceUntil - now) / 1000))
      : null;

  const moveCount = state.history.length;
  const railBanner =
    moveCount === 0
      ? "Waiting for white's first move…"
      : `Move ${Math.ceil(moveCount / 2)} · ${moveCount} ply`;

  return (
    <div className="relative h-screen">
      {/* Center column: board + player rows + actions. Reserves room for the
       *  fixed right rail at xl+. Below xl the rail is hidden, replaced by
       *  the MobileGameBar pinned to the top. */}
      <div className="flex h-full flex-col p-6 xl:pr-[444px] 2xl:pr-[584px]">
        <MobileGameBar
          history={state.history}
          banner={railBanner}
          onFlipBoard={onFlipBoard}
          review={review}
          currentPly={currentPly}
          onSeek={seek}
        />
        <PlayerRow
          login={topPlayer.login}
          image={topPlayer.image}
          rating={topPlayer.rating}
          captured={topCaptured}
          clockText={formatClock(topClock)}
          active={topActive}
          graceSecondsLeft={
            myColor !== null ? opponentGraceSecondsLeft : null
          }
        />

        <div className="flex min-h-0 flex-1 items-center justify-center py-2">
          <BoardFrame>
            <Chessboard
              options={{
                position: displayFen,
                onPieceDrop,
                onSquareClick,
                boardOrientation: orientation,
                allowDragging: isMyTurn && isLiveView,
                animationDurationInMs: 200,
                darkSquareStyle: { backgroundColor: theme.dark },
                lightSquareStyle: { backgroundColor: theme.light },
                squareStyles,
                boardStyle: { borderRadius: 0 },
              }}
            />
          </BoardFrame>
        </div>

        <PlayerRow
          login={bottomPlayer.login}
          image={bottomPlayer.image}
          rating={bottomPlayer.rating}
          captured={bottomCaptured}
          clockText={formatClock(bottomClock)}
          active={bottomActive}
        />

        {state.drawOfferedBy &&
          state.drawOfferedBy !== selfUserId &&
          !isFinished && (
            <div className="mt-2">
              <DrawOfferPrompt
                fromLogin={
                  state.drawOfferedBy === snapshot.white.id
                    ? snapshot.white.login
                    : snapshot.black.login
                }
                onAccept={onAcceptDraw}
                onDecline={onDeclineDraw}
              />
            </div>
          )}

        <GameActionBar
          disabled={isFinished || myColor === null}
          onResign={myColor && !isFinished ? onResign : undefined}
          onOfferDraw={myColor && !isFinished ? onOfferDraw : undefined}
          drawOffered={
            state.drawOfferedBy !== null &&
            state.drawOfferedBy === selfUserId
          }
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

      <GameEndDialog
        open={endDialogOpen}
        onOpenChange={setEndDialogOpen}
        outcome={computeOutcome(state.result, myColor)}
        reason={state.endReason}
        qualities={review.qualities}
        playerColor={myColor}
        newGameLabel="New game"
        reviewHref={`/games/chess/review/${snapshot.id}`}
        onRematch={myColor !== null ? onRematch : undefined}
        rematchState={rematchState}
      />

      {/* Right rail — fixed to the absolute right edge of the viewport. */}
      <aside className="fixed right-0 top-0 hidden h-screen border-l border-white/5 xl:flex xl:w-[420px] 2xl:w-[560px]">
        <RightRail
          history={state.history}
          banner={railBanner}
          onFlipBoard={onFlipBoard}
          review={review}
          currentPly={currentPly}
          onSeek={seek}
          chat={{
            messages: chatMessages,
            selfUserId,
            canSend: selfUserId !== null,
            onSend: onSendChatMessage,
          }}
        />
      </aside>
    </div>
  );
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

function computeOutcome(
  result: GameStatePayload["result"],
  myColor: "w" | "b" | null,
): "win" | "loss" | "draw" {
  if (result === "DRAW" || !result) return "draw";
  if (myColor === null) return "draw"; // spectator — show neutral
  return (myColor === "w" && result === "WHITE_WIN") ||
    (myColor === "b" && result === "BLACK_WIN")
    ? "win"
    : "loss";
}

/**
 * Reads chess.js after a move and produces the optimistic terminal-state
 * patch. Returns null when the position is still ongoing.
 */
function detectTerminal(
  game: Chess,
  mover: "w" | "b" | null,
): Partial<
  Pick<GameStatePayload, "status" | "result" | "endReason">
> | null {
  if (!mover) return null;
  let result: GameStatePayload["result"] = null;
  let reason: ChessEndReasonValue | null = null;
  if (game.isCheckmate()) {
    result = mover === "w" ? "WHITE_WIN" : "BLACK_WIN";
    reason = "CHECKMATE";
  } else if (game.isStalemate()) {
    result = "DRAW";
    reason = "STALEMATE";
  } else if (game.isInsufficientMaterial()) {
    result = "DRAW";
    reason = "DRAW_INSUFFICIENT";
  } else if (game.isThreefoldRepetition()) {
    result = "DRAW";
    reason = "DRAW_THREEFOLD";
  } else if (game.isDraw()) {
    result = "DRAW";
    reason = "DRAW_FIFTY_MOVE";
  }
  if (!result || !reason) return null;
  return { status: "COMPLETED", result, endReason: reason };
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
