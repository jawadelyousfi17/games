import { Chess } from "chess.js";

export type CapturedSet = {
  /** Pieces captured by white (i.e., black pieces removed from the board). */
  white: string[];
  /** Pieces captured by black (i.e., white pieces removed from the board). */
  black: string[];
};

const PIECE_GLYPH: Record<string, { white: string; black: string }> = {
  p: { white: "♙", black: "♟" },
  n: { white: "♘", black: "♞" },
  b: { white: "♗", black: "♝" },
  r: { white: "♖", black: "♜" },
  q: { white: "♕", black: "♛" },
  k: { white: "♔", black: "♚" },
};

/** Numeric ordering used to sort the captured piece glyphs by value. */
const PIECE_ORDER: Record<string, number> = {
  q: 0,
  r: 1,
  b: 2,
  n: 3,
  p: 4,
  k: 5,
};

/**
 * Replays a SAN history through chess.js to derive which pieces each side has
 * captured. Returns Unicode glyphs already coloured for display.
 *
 * Cheap to run — chess.js is fast and the history is short.
 */
export function deriveCaptured(history: string[]): CapturedSet {
  const board = new Chess();
  const result: CapturedSet = { white: [], black: [] };

  for (const san of history) {
    const move = board.move(san);
    if (!move?.captured) continue;
    const capturer = move.color; // "w" | "b" — color making the capture
    const capturedPiece = move.captured.toLowerCase();
    const glyph =
      capturer === "w"
        ? PIECE_GLYPH[capturedPiece].black
        : PIECE_GLYPH[capturedPiece].white;
    if (capturer === "w") result.white.push(glyph);
    else result.black.push(glyph);
  }

  result.white.sort(byValue);
  result.black.sort(byValue);
  return result;
}

function byValue(a: string, b: string): number {
  const aKey = pieceKeyFromGlyph(a);
  const bKey = pieceKeyFromGlyph(b);
  return (PIECE_ORDER[aKey] ?? 9) - (PIECE_ORDER[bKey] ?? 9);
}

function pieceKeyFromGlyph(glyph: string): string {
  switch (glyph) {
    case "♙":
    case "♟":
      return "p";
    case "♘":
    case "♞":
      return "n";
    case "♗":
    case "♝":
      return "b";
    case "♖":
    case "♜":
      return "r";
    case "♕":
    case "♛":
      return "q";
    case "♔":
    case "♚":
      return "k";
    default:
      return "p";
  }
}
