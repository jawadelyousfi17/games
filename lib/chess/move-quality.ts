/**
 * Static-eval result returned by the engine for a position.
 * `cp` and `mate` are mutually exclusive — `mate` wins when present.
 * `bestMove` is the engine's preferred move in UCI notation (e.g. "e2e4").
 */
export type EngineEval = {
  cp: number | null;
  mate: number | null;
  bestMove: string | null;
};

export type Quality =
  | "book"
  | "best"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

/**
 * Visual + verbal labels for a quality bucket. Kept here so the chip
 * component and any future analysis screen can reuse one mapping.
 */
export const QUALITY_META: Record<
  Quality,
  { label: string; color: string; bg: string }
> = {
  book: { label: "Book", color: "#a08864", bg: "rgba(160,136,100,0.20)" },
  best: { label: "Best", color: "#81b64c", bg: "rgba(129,182,76,0.18)" },
  good: { label: "Good", color: "#9ec96f", bg: "rgba(158,201,111,0.18)" },
  inaccuracy: {
    label: "Inaccuracy",
    color: "#e5b04a",
    bg: "rgba(229,176,74,0.18)",
  },
  mistake: { label: "Mistake", color: "#e08a3c", bg: "rgba(224,138,60,0.20)" },
  blunder: { label: "Blunder", color: "#d65a5a", bg: "rgba(214,90,90,0.22)" },
};

/**
 * How many plies at the start of every game count as "book theory" instead
 * of being graded by the engine. 3 full moves × 2 sides = 6 plies — covers
 * the bulk of mainline theory without false-flagging odd-but-fine moves
 * that chess.js's engine sometimes rates as inaccuracies in the opening.
 */
export const OPENING_BOOK_PLIES = 6;

/** Mate scores collapse to ±10_000 centipawns so we have a single domain. */
export const MATE_VALUE = 10_000;

/**
 * Resolves an EngineEval to a single number from white's perspective in
 * centipawns. UCI engines report scores from the side-to-move's perspective,
 * so callers must pass `sideToMove` from the FEN that was analyzed.
 */
export function evalToWhiteCp(
  evalResult: EngineEval,
  sideToMove: "w" | "b",
): number | null {
  const sign = sideToMove === "w" ? 1 : -1;
  if (evalResult.mate !== null) {
    // Positive mate-in-N from STM = STM mates → big number for STM.
    return sign * (evalResult.mate >= 0 ? MATE_VALUE : -MATE_VALUE);
  }
  if (evalResult.cp !== null) return sign * evalResult.cp;
  return null;
}

/**
 * Classifies a move using the centipawn loss from the moving side's view.
 *
 * Both arguments are scores in white-cp. `before` is the position before the
 * move, `after` is the position after the move. Larger drops for the mover
 * grade as worse moves.
 */
export function classifyMove(
  beforeWhiteCp: number,
  afterWhiteCp: number,
  mover: "w" | "b",
): Quality {
  const sign = mover === "w" ? 1 : -1;
  const loss = Math.max(0, sign * (beforeWhiteCp - afterWhiteCp));
  if (loss <= 15) return "best";
  if (loss <= 50) return "good";
  if (loss <= 120) return "inaccuracy";
  if (loss <= 280) return "mistake";
  return "blunder";
}
