/**
 * Curated bot strengths. Each level maps to a Stockfish UCI Skill Level
 * (0–20) plus a search depth and a hard movetime cap. Lower levels
 * deliberately combine low skill with shallow depth so the engine plays
 * recognizably weak chess instead of just slow strong chess.
 */

export type BotLevelId = 1 | 2 | 3 | 4 | 5;

export type BotLevel = {
  id: BotLevelId;
  label: string;
  /** Short tagline shown in the picker. */
  blurb: string;
  /** UCI Skill Level value (0–20). */
  skill: number;
  /** Search depth ceiling. */
  depth: number;
  /** Hard wall-clock budget per move (ms). */
  movetimeMs: number;
  /** Minimum visible think time. The engine often returns in a few ms at
   *  weak levels, which feels jarring — the UI sleeps until this elapses
   *  before applying the move. Higher levels look like they're working. */
  minThinkMs: number;
  /** Approximate Elo for the chip — informative only, not enforced. */
  approxElo: number;
};

export const BOT_LEVELS: BotLevel[] = [
  {
    id: 1,
    label: "Beginner",
    blurb: "Just learning the rules.",
    skill: 0,
    depth: 2,
    movetimeMs: 250,
    minThinkMs: 2000,
    approxElo: 600,
  },
  {
    id: 2,
    label: "Casual",
    blurb: "Plays sound moves but blunders.",
    skill: 5,
    depth: 4,
    movetimeMs: 400,
    minThinkMs: 2200,
    approxElo: 1100,
  },
  {
    id: 3,
    label: "Club",
    blurb: "Solid tactics, knows openings.",
    skill: 10,
    depth: 8,
    movetimeMs: 700,
    minThinkMs: 2500,
    approxElo: 1500,
  },
  {
    id: 4,
    label: "Strong",
    blurb: "Few mistakes, punishes errors.",
    skill: 15,
    depth: 12,
    movetimeMs: 1200,
    minThinkMs: 2800,
    approxElo: 1900,
  },
  {
    id: 5,
    label: "Master",
    blurb: "Engine at full power.",
    skill: 20,
    depth: 16,
    movetimeMs: 2000,
    minThinkMs: 3000,
    approxElo: 2400,
  },
];

export const DEFAULT_BOT_LEVEL: BotLevelId = 2;

export function resolveBotLevel(id: BotLevelId | null | undefined): BotLevel {
  return (
    BOT_LEVELS.find((l) => l.id === id) ??
    BOT_LEVELS.find((l) => l.id === DEFAULT_BOT_LEVEL) ??
    BOT_LEVELS[0]
  );
}
