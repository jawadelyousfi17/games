"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CHESS_THEMES,
  DEFAULT_THEME_ID,
  resolveTheme,
  type ChessTheme,
} from "@/lib/chess/themes";

const STORAGE_KEY = "chess.theme";

/**
 * React hook that owns the active board theme. Persists the choice in
 * localStorage so a player keeps the same board across games + sessions.
 *
 * Returns the resolved theme + a setter that accepts a theme id.
 */
export function useChessTheme(): {
  theme: ChessTheme;
  setThemeId: (id: string) => void;
  themes: ChessTheme[];
} {
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME_ID);

  // Hydration: read persisted choice on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setThemeIdState(stored);
    } catch {
      /* private mode etc. — fall back to default */
    }
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme: resolveTheme(themeId), setThemeId, themes: CHESS_THEMES };
}
