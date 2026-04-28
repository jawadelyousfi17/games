import { getIoInstance } from "./socket-bus";

/**
 * Process-wide presence tracker for the *site*, separate from the per-game
 * attendance map. A user is "online" while at least one of their sockets is
 * connected anywhere on the app.
 *
 * IMPORTANT: state lives on `globalThis` so it survives the dual-bundle
 * problem under Next.js custom server. server.ts (tsx) and server actions
 * (Next.js bundle) import this file from different runtimes; without the
 * globalThis singleton each runtime would carry its own empty map.
 */

declare global {
  // eslint-disable-next-line no-var
  var __chessUserSockets: Map<string, Set<string>> | undefined;
  // eslint-disable-next-line no-var
  var __chessSocketUser: Map<string, string> | undefined;
}

const userSockets: Map<string, Set<string>> =
  globalThis.__chessUserSockets ?? new Map();
globalThis.__chessUserSockets = userSockets;

const socketUser: Map<string, string> =
  globalThis.__chessSocketUser ?? new Map();
globalThis.__chessSocketUser = socketUser;

export const USER_ONLINE_EVENT = "user:online";
export const USER_OFFLINE_EVENT = "user:offline";

/** Returns the user id associated with a given socket id, if any. */
export function userForSocket(socketId: string): string | undefined {
  return socketUser.get(socketId);
}

/** Records a socket coming online for a user. Emits a global `user:online`
 *  event when the user transitions from absent → present. */
export function trackUserConnect(socketId: string, userId: string): void {
  let set = userSockets.get(userId);
  const wasOffline = !set || set.size === 0;
  if (!set) {
    set = new Set();
    userSockets.set(userId, set);
  }
  set.add(socketId);
  socketUser.set(socketId, userId);
  console.log(
    "[chess] trackUserConnect",
    userId,
    "(sockets:",
    set.size,
    "total online:",
    userSockets.size,
    ")",
  );
  if (wasOffline) {
    const io = getIoInstance();
    if (io) io.emit(USER_ONLINE_EVENT, { userId });
  }
}

/** Drops a socket from its user's set. Emits a global `user:offline` event
 *  when the user transitions from present → absent. */
export function trackUserDisconnect(socketId: string): void {
  const userId = socketUser.get(socketId);
  if (!userId) return;
  socketUser.delete(socketId);
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) {
    userSockets.delete(userId);
    const io = getIoInstance();
    if (io) io.emit(USER_OFFLINE_EVENT, { userId });
  }
}

/** Snapshot of all currently-online user ids. */
export function onlineUserIds(): string[] {
  const ids = Array.from(userSockets.keys());
  console.log("[chess] onlineUserIds →", ids.length, "users");
  return ids;
}

/** Lobby room every connected socket joins. */
export const LOBBY_ROOM = "lobby";

/** Per-user room for direct messaging (incoming challenges, notifications). */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}
