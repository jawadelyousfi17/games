/**
 * Stash for the most recently finished bot game. The dedicated review page
 * reads from here instead of from the database — bot games aren't persisted
 * server-side. Lives in sessionStorage so it survives a page navigation but
 * gets cleared when the tab closes.
 */

import type { GameStatePayload } from "./realtime";

const STORAGE_KEY = "chess.bot.lastReview";

export type BotReviewSnapshot = {
  id: string;
  white: { id: string; login: string; image: string | null; rating: number };
  black: { id: string; login: string; image: string | null; rating: number };
  myColor: "w" | "b";
  state: GameStatePayload;
  finished: true;
  /** Bot label shown in the header — e.g. "Stockfish · Casual". */
  botLabel: string;
};

export function saveBotReview(snapshot: BotReviewSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* storage might be disabled (private mode etc.) — non-fatal */
  }
}

export function loadBotReview(): BotReviewSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BotReviewSnapshot;
  } catch {
    return null;
  }
}

export function clearBotReview(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
