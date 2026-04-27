"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { RightRail } from "./right-rail";
import { GameActionBar } from "./game-action-bar";
import { useChessTheme } from "./use-chess-theme";
import { deriveCaptured } from "@/lib/chess/captured";
import { CapturedRow } from "./captured-row";

const TURN_LABEL: Record<"w" | "b", string> = {
  w: "White to move",
  b: "Black to move",
};

/**
 * Local pass-and-play board, same layout shell as the online game so the
 * style stays consistent. No clocks, no rating — just a Reset / Undo control
 * pair in place of the Resign action.
 */
export function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const { theme } = useChessTheme();

  const history = useMemo(() => game.history(), [game, fen]);
  const captured = useMemo(() => deriveCaptured(history), [history]);
  const isOver =
    game.isCheckmate() || game.isStalemate() || game.isDraw();

  useEffect(() => {
    setSelected(null);
  }, [fen]);

  const executeMove = useCallback(
    (from: string, to: string): boolean => {
      try {
        const move = game.move({ from, to, promotion: "q" });
        if (!move) return false;
        setFen(game.fen());
        setLastMove({ from, to });
        setSelected(null);
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
      if (!targetSquare || isOver) return false;
      return executeMove(sourceSquare, targetSquare);
    },
    [isOver, executeMove],
  );

  const onSquareClick = useCallback(
    ({
      square,
      piece,
    }: {
      square: string;
      piece: { pieceType: string } | null;
    }) => {
      if (isOver) return;
      if (selected) {
        const legal: string[] = game
          .moves({ square: selected as Square, verbose: true })
          .map((m) => m.to);
        if (legal.includes(square)) {
          executeMove(selected, square);
          return;
        }
      }
      if (piece && piece.pieceType[0]?.toLowerCase() === game.turn()) {
        setSelected(square);
        return;
      }
      setSelected(null);
    },
    [game, isOver, selected, executeMove],
  );

  const reset = useCallback(() => {
    const fresh = new Chess();
    setGame(fresh);
    setFen(fresh.fen());
    setLastMove(null);
    setSelected(null);
  }, []);

  const undo = useCallback(() => {
    game.undo();
    setFen(game.fen());
    const verbose = game.history({ verbose: true });
    const last = verbose[verbose.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
    setSelected(null);
  }, [game]);

  const onFlipBoard = useCallback(() => {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const out: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      out[lastMove.from] = { background: theme.lastMove };
      out[lastMove.to] = { background: theme.lastMove };
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
  }, [lastMove, theme.lastMove, theme.check, game, selected]);

  const turnLabel = isOver ? "Game over" : TURN_LABEL[game.turn()];

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <SimplePlayerRow
          label={orientation === "white" ? "Black" : "White"}
          captured={
            orientation === "white" ? captured.black : captured.white
          }
          active={!isOver && game.turn() === (orientation === "white" ? "b" : "w")}
        />

        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,calc(100vh-12rem))] overflow-hidden ring-1 ring-white/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
          <Chessboard
            options={{
              position: fen,
              onPieceDrop,
              onSquareClick,
              allowDragging: !isOver,
              animationDurationInMs: 200,
              darkSquareStyle: { backgroundColor: theme.dark },
              lightSquareStyle: { backgroundColor: theme.light },
              squareStyles,
              boardOrientation: orientation,
              boardStyle: { borderRadius: 0 },
            }}
          />
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

      <div className="hidden w-[380px] flex-shrink-0 border-l border-white/5 lg:flex">
        <RightRail
          history={history}
          banner={turnLabel}
          onFlipBoard={onFlipBoard}
        />
      </div>
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
          active
            ? "bg-white text-navy-900"
            : "bg-navy-700 text-white"
        }`}
      >
        {label[0]}
      </div>
      <span className="text-[13px] font-semibold text-white">{label}</span>
      <CapturedRow pieces={captured} />
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
