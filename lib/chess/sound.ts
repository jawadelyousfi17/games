/**
 * Audio cues for the chess board. MP3 assets ship under
 * /public/sounds/chess/ — preloaded HTMLAudioElements per source so
 * subsequent triggers are instant.
 */

import type { ChessEndReasonValue } from "./realtime";

const SRC = {
  whiteMove: "/sounds/chess/chess-white-move.mp3",
  blackMove: "/sounds/chess/chess-black-move.mp3",
  whiteCapture: "/sounds/chess/chess-white-capture.mp3",
  blackCapture: "/sounds/chess/chess-black-capture.mp3",
  check: "/sounds/chess/chess-check.mp3",
  castle: "/sounds/chess/chess-casttle.mp3",
  opening: "/sounds/chess/chess-openning.mp3",
  checkmate: "/sounds/chess/chess-game-over-by-checkmate.mp3",
  gameOver: "/sounds/chess/chess-game-over-not-by-checkmate.mp3",
} as const;

const cache = new Map<string, HTMLAudioElement>();

function play(src: string, volume = 0.6): void {
  if (typeof window === "undefined") return;
  let el = cache.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = "auto";
    cache.set(src, el);
  }
  try {
    el.currentTime = 0;
  } catch {
    /* some browsers throw when seeking before metadata loads */
  }
  el.volume = volume;
  void el.play().catch(() => {
    /* autoplay policy or first-user-gesture not yet given; silent fail */
  });
}

/**
 * Pre-warm the audio cache so the first move's sound isn't delayed by the
 * browser fetching the asset. Safe to call repeatedly.
 */
export function preloadChessSounds(): void {
  if (typeof window === "undefined") return;
  for (const src of Object.values(SRC)) {
    if (cache.has(src)) continue;
    const el = new Audio(src);
    el.preload = "auto";
    cache.set(src, el);
  }
}

/** Plays the opening fanfare — used when a fresh game begins. */
export function playOpeningSound(): void {
  play(SRC.opening, 0.5);
}

/**
 * Plays the appropriate cue for the most recent move. Decodes the SAN
 * string for capture/check/castle/mate flags; falls back to a side-specific
 * move sound when the move is unremarkable. Mate plays nothing here — the
 * game-end sound covers it.
 *
 * @param san  Standard algebraic notation of the move (e.g. "Nxe5+", "O-O").
 * @param plyIndex  Zero-based ply index — even = white moved, odd = black.
 */
export function playMoveSoundFromSan(san: string, plyIndex: number): void {
  if (san.includes("#")) return; // game-end sound takes over
  if (san.startsWith("O-O")) {
    play(SRC.castle);
    return;
  }
  if (san.includes("+")) {
    play(SRC.check);
    return;
  }
  const isWhiteMove = plyIndex % 2 === 0;
  if (san.includes("x")) {
    play(isWhiteMove ? SRC.whiteCapture : SRC.blackCapture);
    return;
  }
  play(isWhiteMove ? SRC.whiteMove : SRC.blackMove);
}

/**
 * Plays the game-end cue. Distinguishes checkmate from every other
 * terminal reason so the mate sound feels weightier.
 */
export function playGameEndSound(endReason: ChessEndReasonValue | null): void {
  play(endReason === "CHECKMATE" ? SRC.checkmate : SRC.gameOver, 0.7);
}
