/**
 * Realtime transport for chess game state.
 *
 * Server-authoritative broadcasting: server actions persist a move to the DB,
 * then post the resulting state to Supabase's REST broadcast endpoint.
 * Subscribed clients receive the payload over their existing Realtime
 * websocket and update without polling.
 *
 * Polling is kept as a slow-cadence fallback in case a broadcast is missed
 * (Supabase Realtime broadcast is best-effort, not guaranteed delivery).
 */

export type ChessEndReasonValue =
  | "CHECKMATE"
  | "RESIGN"
  | "TIMEOUT"
  | "STALEMATE"
  | "DRAW_INSUFFICIENT"
  | "DRAW_THREEFOLD"
  | "DRAW_FIFTY_MOVE"
  | "DRAW_AGREED"
  | "ABORT"
  | "DISCONNECT";

export type ChatMessagePayload = {
  id: string;
  userId: string;
  /** 42 intra login, used for the avatar fallback + display. */
  login: string;
  body: string;
  /** ISO timestamp; client formats as relative or short-time. */
  createdAt: string;
};

export type GameStatePayload = {
  fen: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  result: "WHITE_WIN" | "BLACK_WIN" | "DRAW" | null;
  endReason: ChessEndReasonValue | null;
  whiteMs: number;
  blackMs: number;
  /** ISO timestamp of the last accepted move. Drives client-side clock countdown. */
  lastMoveAt: string;
  /** SAN list, in ply order. */
  history: string[];
  /** From/to of the most recent move, or null on the starting position. */
  lastMove: { from: string; to: string } | null;
  /** User id of whoever currently has an open draw offer; null when none. */
  drawOfferedBy: string | null;
};

/** Channel name format. Same string on client + server. */
export function gameChannelName(gameId: string): string {
  return `chess:game:${gameId}`;
}

/** Event identifier used for state broadcasts. */
export const GAME_STATE_EVENT = "state";

/**
 * Posts a state update to the game channel via Supabase's REST broadcast
 * endpoint. Direct HTTP — no WebSocket subscription required from the
 * server side. Subscribers on the same topic receive it through their
 * existing Realtime websocket.
 *
 * No-op if Supabase env vars are missing — the polling fallback keeps things
 * working.
 */
export async function broadcastGameState(
  gameId: string,
  payload: GameStatePayload,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;

  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: gameChannelName(gameId),
            event: GAME_STATE_EVENT,
            payload,
            private: false,
          },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(
        "[chess] broadcast failed",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    // Don't block the move handler — DB state is committed, polling will
    // reconcile on the next tick.
    console.warn("[chess] broadcast threw", err);
  }
}
