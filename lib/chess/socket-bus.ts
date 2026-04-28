import type { Server as IoServer } from "socket.io";
import type { ChatMessagePayload, GameStatePayload } from "./realtime";

/**
 * Process-wide reference to the Socket.IO server. Set once by server.ts at
 * boot, read by server actions when they need to fan out updates.
 *
 * Single-process custom-server only — for serverless deploys, swap this for
 * an external pub/sub.
 */

declare global {
  var __chessIo: IoServer | undefined;
}

export function setIoInstance(io: IoServer): void {
  globalThis.__chessIo = io;
}

export function getIoInstance(): IoServer | null {
  return globalThis.__chessIo ?? null;
}

export function gameRoom(gameId: string): string {
  return `chess:game:${gameId}`;
}

export const GAME_STATE_EVENT = "state";
export const PRESENCE_EVENT = "presence";
export const CHAT_EVENT = "chat";
export const CHALLENGE_INCOMING_EVENT = "challenge:incoming";
export const CHALLENGE_RESOLVED_EVENT = "challenge:resolved";

/** Direct-message room for a single user. Mirrors `userRoom` in
 *  online-tracker so server actions can target a specific user. */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export type ChallengeIncomingPayload = {
  challengeId: string;
  challengerId: string;
  challengerLogin: string;
  challengerRating: number;
  initialMs: number;
  incrementMs: number;
  expiresAt: string;
};

export type ChallengeResolvedPayload = {
  challengeId: string;
  status: "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  gameId?: string;
};

/** Sends an incoming-challenge notification to the target user's room. */
export function emitChallengeIncoming(
  challengedUserId: string,
  payload: ChallengeIncomingPayload,
): void {
  const io = getIoInstance();
  if (!io) return;
  io.to(userRoom(challengedUserId)).emit(CHALLENGE_INCOMING_EVENT, payload);
}

/** Sends the resolution outcome to both sides of a challenge. */
export function emitChallengeResolved(
  userIds: string[],
  payload: ChallengeResolvedPayload,
): void {
  const io = getIoInstance();
  if (!io) return;
  for (const id of userIds) {
    io.to(userRoom(id)).emit(CHALLENGE_RESOLVED_EVENT, payload);
  }
}

/**
 * Per-user presence change in a chess game. `graceUntil` is the epoch ms at
 * which the disconnected player will be forfeited; null while they're
 * connected.
 */
export type PresencePayload = {
  userId: string;
  present: boolean;
  graceUntil: number | null;
};

/**
 * Emits a state update to every socket in the game's room.
 */
export function emitGameState(
  gameId: string,
  payload: GameStatePayload,
): void {
  const io = getIoInstance();
  if (!io) {
    console.warn(
      "[chess] emitGameState skipped — Socket.IO not attached (custom server not running?)",
      gameId,
    );
    return;
  }
  const room = gameRoom(gameId);
  const sockets = io.sockets.adapter.rooms.get(room);
  console.info(
    `[chess] emit ${GAME_STATE_EVENT} → ${room} · ${sockets?.size ?? 0} subscribers`,
  );
  io.to(room).emit(GAME_STATE_EVENT, payload);
}

/**
 * Emits a presence transition to everyone in the game's room.
 * No-op if no Socket.IO instance is attached.
 */
export function emitPresence(
  gameId: string,
  payload: PresencePayload,
): void {
  const io = getIoInstance();
  if (!io) return;
  io.to(gameRoom(gameId)).emit(PRESENCE_EVENT, payload);
}

/**
 * Emits a chat message to everyone in the game's room. The sender is
 * included so their own client can render the message immediately rather
 * than waiting on a refetch.
 */
export function emitChatMessage(
  gameId: string,
  payload: ChatMessagePayload,
): void {
  const io = getIoInstance();
  if (!io) return;
  io.to(gameRoom(gameId)).emit(CHAT_EVENT, payload);
}
