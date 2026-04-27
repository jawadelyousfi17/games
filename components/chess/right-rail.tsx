"use client";

import { useState, type ReactNode } from "react";
import { MoveList } from "./move-list";
import { MoveNav } from "./move-nav";
import { ThemePicker } from "./theme-picker";
import { useChessTheme } from "./use-chess-theme";

type RightRailProps = {
  /** Move history in SAN order. Drives the Moves tab. */
  history: string[];
  /** Optional opening / status banner shown above the tabs. */
  banner?: ReactNode;
  /** Triggered by the flip-board button in the move-nav strip. */
  onFlipBoard: () => void;
};

type SubTab = "moves" | "chat" | "info";

const TOP_TABS = ["Play", "New Game", "Games", "Players"] as const;

/**
 * chess.com-style right rail: top tab bar, optional status banner, sub-tabs
 * (Moves / Chat / Info), main content area, and the move-nav strip docked
 * to the bottom.
 */
export function RightRail({ history, banner, onFlipBoard }: RightRailProps) {
  const [subTab, setSubTab] = useState<SubTab>("moves");
  const { theme, setThemeId, themes } = useChessTheme();

  return (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="flex border-b border-white/5">
        {TOP_TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            disabled
            className={`flex-1 py-4 text-[13px] font-semibold transition ${
              i === 0
                ? "border-b-2 border-brand-lime text-white"
                : "text-navy-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {banner && (
        <div className="border-b border-white/5 bg-navy-800/60 px-5 py-3 text-[13px] font-medium text-navy-100">
          {banner}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/5 px-3">
        <div className="flex">
          {(
            [
              { id: "moves", label: "Moves" },
              { id: "chat", label: "Chat" },
              { id: "info", label: "Info" },
            ] as const
          ).map((t) => {
            const active = t.id === subTab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`px-4 py-3 text-[13px] font-semibold transition ${
                  active
                    ? "text-white"
                    : "text-navy-400 hover:text-navy-200"
                }`}
              >
                {t.label}
                {active && (
                  <span className="mx-auto mt-1 block h-0.5 w-full rounded-full bg-brand-lime" />
                )}
              </button>
            );
          })}
        </div>
        <div className="pr-2">
          <ThemePicker themes={themes} active={theme} onSelect={setThemeId} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {subTab === "moves" && <MoveList history={history} />}
        {subTab === "chat" && (
          <Placeholder>Chat is coming soon.</Placeholder>
        )}
        {subTab === "info" && (
          <Placeholder>Game info coming soon.</Placeholder>
        )}
      </div>

      <div className="border-t border-white/5">
        <MoveNav onFlip={onFlipBoard} />
      </div>
    </div>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-[13px] text-navy-400">
      {children}
    </div>
  );
}
