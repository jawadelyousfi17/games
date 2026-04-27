/** Default starting rating for a player who has never played. */
export const DEFAULT_RATING = 1200;

/** K-factor used in the Elo update. K=32 is standard for casual ladders. */
export const K_FACTOR = 32;

/** Game result from the perspective of the white player. */
export type WhiteScore = 1 | 0 | 0.5;

/**
 * Standard Elo expected-score formula. Returns white's expected fraction of
 * the point (between 0 and 1). Used for the pre-game win-probability bar.
 */
export function expectedWhiteScore(
  whiteRating: number,
  blackRating: number,
): number {
  return 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
}

/**
 * Computes new Elo ratings for white and black after a single game.
 * Rounds to the nearest integer; floors are not applied.
 */
export function applyElo(
  whiteRating: number,
  blackRating: number,
  whiteScore: WhiteScore,
): { white: number; black: number } {
  const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
  const expectedBlack = 1 - expectedWhite;
  const blackScore = 1 - whiteScore;

  return {
    white: Math.round(whiteRating + K_FACTOR * (whiteScore - expectedWhite)),
    black: Math.round(blackRating + K_FACTOR * (blackScore - expectedBlack)),
  };
}
