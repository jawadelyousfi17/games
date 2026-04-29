"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPositions, type PositionTrace } from "@/lib/chess/positions";
import { useStockfish, type EngineStatus } from "./use-stockfish";
import {
  classifyMove,
  evalToWhiteCp,
  OPENING_BOOK_PLIES,
  type Quality,
} from "@/lib/chess/move-quality";

export type ReviewStatus = EngineStatus | "analyzing" | "idle";

export type GameReview = {
  qualities: Array<Quality | null>;
  /** Engine state machine for surfacing a status chip in the UI. */
  status: ReviewStatus;
  /** Number of plies that have a resolved quality classification. */
  analyzed: number;
  /** Total ply count being analyzed. */
  total: number;
  /** Pre-computed FENs + per-ply moves for the walk-through controls. */
  positions: PositionTrace;
  /** White-pov centipawn evals indexed by FEN, populated as analysis lands. */
  evals: Record<string, number>;
  /** Engine's preferred move for each FEN, in UCI ("e2e4"). */
  bestMoves: Record<string, string>;
};

/**
 * Live engine review for a chess game.
 *
 * Replays the SAN history into per-ply FENs, lazily evaluates each unique
 * FEN with Stockfish, then classifies each ply based on the centipawn delta
 * from the moving side's perspective.
 */
export function useGameReview(history: string[]): GameReview {
  const { status: engineStatus, analyze } = useStockfish();
  const [evals, setEvals] = useState<Record<string, number>>({});
  const [bestMoves, setBestMoves] = useState<Record<string, string>>({});

  const positions = useMemo(() => buildPositions(history), [history]);
  const fens = positions.fens;

  useEffect(() => {
    if (engineStatus !== "ready") return;
    let cancelled = false;
    (async () => {
      for (const fen of fens) {
        if (cancelled) return;
        if (evals[fen] !== undefined && bestMoves[fen] !== undefined) continue;
        const result = await analyze(fen, { depth: 12 });
        if (!result || cancelled) continue;
        const sideToMove: "w" | "b" =
          fen.split(" ")[1] === "b" ? "b" : "w";
        const whiteCp = evalToWhiteCp(result, sideToMove);
        if (whiteCp !== null) {
          setEvals((prev) =>
            prev[fen] !== undefined ? prev : { ...prev, [fen]: whiteCp },
          );
        }
        if (result.bestMove) {
          const best = result.bestMove;
          setBestMoves((prev) =>
            prev[fen] !== undefined ? prev : { ...prev, [fen]: best },
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineStatus, fens, analyze]);

  const qualities = useMemo<Array<Quality | null>>(() => {
    const out: Array<Quality | null> = [];
    for (let i = 0; i < history.length; i++) {
      // First N plies are auto-tagged as opening theory regardless of the
      // engine's verdict — matches chess.com behaviour where book moves
      // never get flagged as inaccuracies/mistakes.
      if (i < OPENING_BOOK_PLIES) {
        out.push("book");
        continue;
      }
      const before = evals[fens[i]];
      const after = evals[fens[i + 1]];
      if (before === undefined || after === undefined) {
        out.push(null);
        continue;
      }
      const mover: "w" | "b" = i % 2 === 0 ? "w" : "b";
      out.push(classifyMove(before, after, mover));
    }
    return out;
  }, [history, fens, evals]);

  const analyzed = qualities.filter((q) => q !== null).length;
  const total = history.length;
  const status: ReviewStatus =
    engineStatus === "loading"
      ? "loading"
      : engineStatus === "error"
        ? "error"
        : analyzed < total
          ? "analyzing"
          : "idle";

  return { qualities, status, analyzed, total, positions, evals, bestMoves };
}
