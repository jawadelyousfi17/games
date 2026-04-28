import { forfeitChessGame } from "./forfeit";
import { emitPresence, type PresencePayload } from "./socket-bus";

/**
 * Grace period before a disconnected player loses by forfeit. Tab close,
 * laptop sleep, or short network drops should NOT cost the game.
 */
export const FORFEIT_GRACE_MS = 60_000;

/**
 * State lives on `globalThis` so it stays consistent across the dual-bundle
 * problem under Next.js custom server (server.ts via tsx vs server actions
 * via the Next.js bundle each see the same map).
 */
declare global {
  // eslint-disable-next-line no-var
  var __chessAttendance: Map<string, Map<string, Set<string>>> | undefined;
  // eslint-disable-next-line no-var
  var __chessAttendanceTimers: Map<string, NodeJS.Timeout> | undefined;
  // eslint-disable-next-line no-var
  var __chessGraceDeadlines: Map<string, number> | undefined;
  // eslint-disable-next-line no-var
  var __chessSocketIndex: Map<string, Set<string>> | undefined;
}

/** gameId → userId → Set<socketId>. */
const attendance: Map<string, Map<string, Set<string>>> =
  globalThis.__chessAttendance ?? new Map();
globalThis.__chessAttendance = attendance;

/** Pending forfeit timers keyed by `${gameId}::${userId}`. */
const timers: Map<string, NodeJS.Timeout> =
  globalThis.__chessAttendanceTimers ?? new Map();
globalThis.__chessAttendanceTimers = timers;

/** Forfeit deadline (epoch ms), keyed the same way. */
const graceDeadlines: Map<string, number> =
  globalThis.__chessGraceDeadlines ?? new Map();
globalThis.__chessGraceDeadlines = graceDeadlines;

/** Reverse index: socket id → entries it joined. */
const socketIndex: Map<string, Set<string>> =
  globalThis.__chessSocketIndex ?? new Map();
globalThis.__chessSocketIndex = socketIndex;

function key(gameId: string, userId: string): string {
  return `${gameId}::${userId}`;
}

/** Records that a user's socket is present in a game, cancels any pending
 *  forfeit timer, and broadcasts the new presence to the room (only when
 *  the user transitions from absent → present). */
export function recordPresence(
  gameId: string,
  userId: string,
  socketId: string,
): void {
  let game = attendance.get(gameId);
  if (!game) {
    game = new Map();
    attendance.set(gameId, game);
  }
  let user = game.get(userId);
  const wasAbsent = !user || user.size === 0;
  if (!user) {
    user = new Set();
    game.set(userId, user);
  }
  user.add(socketId);

  let socketEntries = socketIndex.get(socketId);
  if (!socketEntries) {
    socketEntries = new Set();
    socketIndex.set(socketId, socketEntries);
  }
  socketEntries.add(key(gameId, userId));

  const k = key(gameId, userId);
  const t = timers.get(k);
  if (t) {
    clearTimeout(t);
    timers.delete(k);
  }
  graceDeadlines.delete(k);

  if (wasAbsent) {
    emitPresence(gameId, { userId, present: true, graceUntil: null });
  }
}

/** Removes a single socket. Starts the forfeit timer when the user has no
 *  more sockets in the game and broadcasts the disconnect with the deadline. */
export function recordAbsence(
  gameId: string,
  userId: string,
  socketId: string,
): void {
  const game = attendance.get(gameId);
  if (!game) return;
  const user = game.get(userId);
  if (!user) return;
  user.delete(socketId);
  if (user.size > 0) return;

  game.delete(userId);
  if (game.size === 0) attendance.delete(gameId);

  const k = key(gameId, userId);
  if (timers.has(k)) return;

  const graceUntil = Date.now() + FORFEIT_GRACE_MS;
  graceDeadlines.set(k, graceUntil);
  emitPresence(gameId, { userId, present: false, graceUntil });

  const timer = setTimeout(async () => {
    timers.delete(k);
    graceDeadlines.delete(k);
    const stillAbsent = !attendance.get(gameId)?.get(userId)?.size;
    if (!stillAbsent) return;
    try {
      await forfeitChessGame(gameId, userId, "DISCONNECT");
    } catch (err) {
      console.warn("[chess] disconnect forfeit failed", err);
    }
  }, FORFEIT_GRACE_MS);
  timers.set(k, timer);
}

/** Drops every (game, user) attendance entry tied to a socket id. */
export function dropSocket(socketId: string): void {
  const entries = socketIndex.get(socketId);
  if (!entries) return;
  for (const k of entries) {
    const [gameId, userId] = k.split("::");
    if (gameId && userId) recordAbsence(gameId, userId, socketId);
  }
  socketIndex.delete(socketId);
}

/**
 * Snapshot of presence for every user currently tracked in a game. Used to
 * hydrate a freshly-joined socket so the UI reflects whether the opponent
 * is already disconnected and how much grace they have left.
 */
export function presenceSnapshot(gameId: string): PresencePayload[] {
  const out: PresencePayload[] = [];
  const game = attendance.get(gameId);
  if (game) {
    for (const [userId, sockets] of game) {
      if (sockets.size > 0) {
        out.push({ userId, present: true, graceUntil: null });
      }
    }
  }
  for (const [k, graceUntil] of graceDeadlines) {
    const [gid, userId] = k.split("::");
    if (gid !== gameId) continue;
    out.push({ userId, present: false, graceUntil });
  }
  return out;
}
