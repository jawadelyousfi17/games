"use client";

import { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { useChessTheme } from "./use-chess-theme";

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Decorative starting-position chess board shown on the lobby. Non-interactive
 * (`allowDragging: false`); themed via the same provider as live games so the
 * preview matches the user's chosen palette.
 */
export function LobbyBoardPreview() {
  const { theme } = useChessTheme();
  const options = useMemo(
    () => ({
      position: STARTING_FEN,
      allowDragging: false,
      darkSquareStyle: { backgroundColor: theme.dark },
      lightSquareStyle: { backgroundColor: theme.light },
      boardStyle: { borderRadius: 0 },
      showNotation: true,
    }),
    [theme.dark, theme.light],
  );
  return <Chessboard options={options} />;
}
