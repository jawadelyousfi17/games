/**
 * Shared types for the chess game state payload.
 *
 * Originally fanned out via Supabase Realtime; now the client simply polls
 * `getChessGame` on an interval. The payload shape is kept here so server
 * helpers and client components agree on what one game-state snapshot looks
 * like, independent of transport.
 */
export type GameStatePayload = {
  fen: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  result: "WHITE_WIN" | "BLACK_WIN" | "DRAW" | null;
  whiteMs: number;
  blackMs: number;
  /** ISO timestamp of the last accepted move. Drives client-side clock countdown. */
  lastMoveAt: string;
  /** SAN list, in ply order. */
  history: string[];
  /** From/to of the most recent move, or null on the starting position. */
  lastMove: { from: string; to: string } | null;
};
