export type ChessTheme = {
  id: string;
  name: string;
  light: string;
  dark: string;
  /** Square overlay used to mark the from/to of the most recent move. */
  lastMove: string;
  /** Square overlay used when the king is in check. */
  check: string;
  /** Background of the surrounding game frame for subtle ambience. */
  ambient: string;
};

/**
 * Curated board palettes. Keep this list short — picker UX gets noisy past 6.
 * IDs are stable and stored in localStorage; never rename.
 */
export const CHESS_THEMES: ChessTheme[] = [
  {
    id: "green",
    name: "Green",
    light: "#eeeed2",
    dark: "#769656",
    lastMove: "rgba(186, 202, 43, 0.55)",
    check: "rgba(214, 90, 90, 0.55)",
    ambient: "transparent",
  },
  {
    id: "classic",
    name: "Classic",
    light: "#f0d9b5",
    dark: "#b58863",
    lastMove: "rgba(255, 220, 60, 0.55)",
    check: "rgba(214, 90, 90, 0.55)",
    ambient: "transparent",
  },
  {
    id: "blue",
    name: "Blue",
    light: "#dee3e6",
    dark: "#788ea7",
    lastMove: "rgba(255, 235, 100, 0.5)",
    check: "rgba(214, 90, 90, 0.55)",
    ambient: "transparent",
  },
  {
    id: "wood",
    name: "Wood",
    light: "#d6a96b",
    dark: "#7a4a26",
    lastMove: "rgba(255, 220, 60, 0.45)",
    check: "rgba(214, 90, 90, 0.55)",
    ambient: "transparent",
  },
  {
    id: "ink",
    name: "Ink",
    light: "#5a5854",
    dark: "#262421",
    lastMove: "rgba(129, 182, 76, 0.45)",
    check: "rgba(214, 90, 90, 0.55)",
    ambient: "transparent",
  },
];

export const DEFAULT_THEME_ID = "green";

/** Resolves a theme id to its full preset, falling back to the default. */
export function resolveTheme(id: string | null | undefined): ChessTheme {
  return (
    CHESS_THEMES.find((t) => t.id === id) ??
    CHESS_THEMES.find((t) => t.id === DEFAULT_THEME_ID) ??
    CHESS_THEMES[0]
  );
}
