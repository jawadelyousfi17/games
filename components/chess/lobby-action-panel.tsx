"use client";

import { useState } from "react";
import { QueueButton } from "./queue-button";
import { ChevronDownIcon, ClockIcon } from "@/components/shell/sidebar-icons";

type Tab = "new" | "games" | "players";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "new", label: "New Game", icon: "+" },
  { id: "games", label: "Games", icon: "⊟" },
  { id: "players", label: "Players", icon: "◐" },
];

/**
 * Right-rail action panel for the chess lobby. Mirrors the chess.com pattern:
 * three top tabs, a time-control display, and a stack of dark action buttons
 * with the primary green CTA at the top.
 */
export function LobbyActionPanel() {
  const [tab, setTab] = useState<Tab>("new");

  return (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <nav className="flex border-b border-white/5">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-1.5 py-5 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-b-2 border-brand-lime text-white"
                  : "text-navy-300 hover:text-white"
              }`}
            >
              <span className="text-[20px] leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {tab === "new" && <NewGameTab />}
        {tab === "games" && (
          <Placeholder>Recent games show in the lobby below.</Placeholder>
        )}
        {tab === "players" && (
          <Placeholder>Player browser coming soon.</Placeholder>
        )}
      </div>
    </div>
  );
}

function NewGameTab() {
  return (
    <>
      <button
        type="button"
        className="flex h-14 items-center justify-between rounded-md bg-navy-800 px-5 text-[15px] font-semibold text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
      >
        <span className="flex items-center gap-2.5">
          <ClockIcon className="h-5 w-5 text-navy-300" />
          5 min (Blitz)
        </span>
        <ChevronDownIcon className="h-4 w-4 text-navy-300" />
      </button>

      <QueueButton />

      <SecondaryAction icon="⚔" label="Custom Challenge" disabled />
      <SecondaryAction icon="👤" label="Play a Friend" disabled />
      <SecondaryAction icon="🏆" label="Tournaments" disabled />
    </>
  );
}

function SecondaryAction({
  icon,
  label,
  disabled,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex h-14 items-center justify-center gap-2.5 rounded-md bg-navy-800 text-[15px] font-semibold text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-md bg-navy-800 p-6 text-center text-[14px] font-medium text-navy-300 ring-1 ring-white/5">
      {children}
    </div>
  );
}
