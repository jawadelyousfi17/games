import type { ReactNode } from "react";
import type { ChessTheme } from "@/lib/chess/themes";

type BoardStageProps = {
  /** Theme drives the ring + ambient glow that surround the board. */
  theme: ChessTheme;
  children: ReactNode;
};

/**
 * Wraps the chess board with a "stage": a soft ambient glow ring and a deep
 * drop shadow so the board feels lifted off the page. Theme-aware so the
 * glow color matches the board palette.
 */
export function BoardStage({ theme, children }: BoardStageProps) {
  return (
    <div className="relative">
      {/* Outer ambient glow — matches theme dark color, sits behind the board. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 rounded-[36px] opacity-50 blur-2xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.dark}99, transparent 70%)`,
        }}
      />
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-white/10"
        style={{
          boxShadow:
            "0 40px 90px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
