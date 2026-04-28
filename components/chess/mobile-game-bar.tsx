"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FlipVertical2,
  ListOrdered,
  MessageSquare,
  Info,
} from "lucide-react";
import { ThemePicker } from "./theme-picker";
import { useChessTheme } from "./use-chess-theme";

import type { Quality } from "@/lib/chess/move-quality";
import { MoveQualityBadge } from "./move-quality-badge";
import { ReviewStatus } from "./review-status";
import type { GameReview } from "./use-game-review";

type MobileGameBarProps = {
  /** SAN move history; rendered as a horizontal scrollable strip. */
  history: string[];
  /** Optional banner text (status / opening). Shown above the moves strip. */
  banner?: string;
  onFlipBoard: () => void;
  /** Live engine review (status + per-ply qualities). */
  review?: GameReview;
  /** Currently viewed ply (-1 = starting position). */
  currentPly: number;
  /** Seek handler — used by clickable move chips. */
  onSeek: (ply: number) => void;
};

type Tab = "moves" | "chat" | "info";

const TAB_ICONS: Record<Tab, typeof ListOrdered> = {
  moves: ListOrdered,
  chat: MessageSquare,
  info: Info,
};

/**
 * Compact horizontal bar shown at the top of the game arena on viewports too
 * narrow for the right rail (< xl). Surfaces the same essentials: tab
 * switcher, move history strip, and the flip-board control.
 *
 * Design note: the move list runs horizontally and scrolls — the right rail
 * style would otherwise eat too much vertical space on a phone.
 */
export function MobileGameBar({
  history,
  banner,
  onFlipBoard,
  review,
  currentPly,
  onSeek,
}: MobileGameBarProps) {
  const [tab, setTab] = useState<Tab>("moves");
  const { theme, setThemeId, themes } = useChessTheme();

  return (
    <div className="sticky top-0 z-20 -mx-6 mb-4 border-b border-white/5 bg-navy-900 py-3 pl-16 pr-4 md:pl-4 xl:hidden">
      <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-navy-200">
        {banner && <span className="truncate">{banner}</span>}
        {review && (
          <span className="ml-auto shrink-0">
            <ReviewStatus
              status={review.status}
              analyzed={review.analyzed}
              total={review.total}
            />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex shrink-0">
          {(["moves", "chat", "info"] as const).map((t) => {
            const Icon = TAB_ICONS[t];
            const active = t === tab;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                  active
                    ? "bg-white/[0.07] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]"
                    : "text-navy-300 hover:text-white"
                }`}
                aria-label={t}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          {tab === "moves" && (
            <HorizontalMoves
              history={history}
              qualities={review?.qualities}
              currentPly={currentPly}
              onSeek={onSeek}
            />
          )}
          {tab === "chat" && <Hint>Chat is coming soon.</Hint>}
          {tab === "info" && <Hint>Game info coming soon.</Hint>}
        </div>

        <ThemePicker themes={themes} active={theme} onSelect={setThemeId} />

        <button
          type="button"
          aria-label="Flip board"
          onClick={onFlipBoard}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy-800 text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
        >
          <FlipVertical2 className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

function HorizontalMoves({
  history,
  qualities,
  currentPly,
  onSeek,
}: {
  history: string[];
  qualities?: Array<Quality | null>;
  currentPly: number;
  onSeek: (ply: number) => void;
}) {
  if (history.length === 0) {
    return <Hint>Game starts with white&apos;s move.</Hint>;
  }

  return (
    <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto whitespace-nowrap text-[13px] font-semibold">
      {history.map((san, i) => {
        const isWhite = i % 2 === 0;
        const moveNum = Math.floor(i / 2) + 1;
        const q = qualities?.[i] ?? null;
        const current = i === currentPly;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSeek(i)}
            className={`flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 transition hover:bg-white/[0.05] ${
              current ? "bg-brand-lime/15 text-white" : ""
            }`}
          >
            {isWhite && (
              <span className="text-navy-400">{moveNum}.</span>
            )}
            <span className={isWhite ? "text-white" : "text-navy-100"}>
              {san}
            </span>
            {q && <MoveQualityBadge quality={q} compact />}
          </button>
        );
      })}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-medium text-navy-400">{children}</div>
  );
}
