"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Plus, Users, Swords, UserPlus, Trophy } from "lucide-react";
import { QueueButton } from "./queue-button";
import { TimeControlPicker } from "./time-control-picker";
import { OnlinePlayersList } from "./online-players-list";
import {
  DEFAULT_TIME_CONTROL_ID,
  type TimeControlId,
} from "@/lib/chess/time-controls";
import { getOnlineCount } from "@/actions/users/get-online-count";

type Tab = "new" | "players";

const TABS: { id: Tab; label: string; Icon: typeof Plus }[] = [
  { id: "new", label: "New Game", Icon: Plus },
  { id: "players", label: "Players", Icon: Users },
];

/**
 * Lobby right-rail action panel. Two tabs only:
 *   - New Game: pick time control, find a random match, jump to Players,
 *     plus inactive placeholders for Play a Friend + Tournaments.
 *   - Players: search + live list of online users with Challenge buttons.
 *
 * Online count surfaces live in the New Game tab so users see how lively
 * the community is at a glance.
 */
export function LobbyActionPanel() {
  const [tab, setTab] = useState<Tab>("new");
  const [timeControlId, setTimeControlId] = useState<TimeControlId>(
    DEFAULT_TIME_CONTROL_ID,
  );
  const [onlineCount, setOnlineCount] = useState<number>(0);

  // Initial fetch + subscribe to user:online / user:offline so the count
  // animates as people log in / out.
  useEffect(() => {
    let cancelled = false;
    void getOnlineCount().then((n) => {
      if (!cancelled) setOnlineCount(n);
    });

    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });
    const refresh = async () => {
      const n = await getOnlineCount();
      if (!cancelled) setOnlineCount(n);
    };
    socket.on("user:online", refresh);
    socket.on("user:offline", refresh);

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <nav className="flex border-b border-white/5">
        {TABS.map((t) => {
          const active = t.id === tab;
          const Icon = t.Icon;
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
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {tab === "new" && (
          <NewGameTab
            timeControlId={timeControlId}
            onTimeControlChange={setTimeControlId}
            onlineCount={onlineCount}
            onOpenPlayers={() => setTab("players")}
          />
        )}
        {tab === "players" && <OnlinePlayersList />}
      </div>
    </div>
  );
}

function NewGameTab({
  timeControlId,
  onTimeControlChange,
  onlineCount,
  onOpenPlayers,
}: {
  timeControlId: TimeControlId;
  onTimeControlChange: (id: TimeControlId) => void;
  onlineCount: number;
  onOpenPlayers: () => void;
}) {
  return (
    <>
      <TimeControlPicker
        value={timeControlId}
        onChange={onTimeControlChange}
      />
      <QueueButton timeControlId={timeControlId} />

      <BattleAction onlineCount={onlineCount} onClick={onOpenPlayers} />
      <SecondaryAction Icon={UserPlus} label="Play a Friend" disabled />
      <SecondaryAction Icon={Trophy} label="Tournaments" disabled />
    </>
  );
}

function BattleAction({
  onlineCount,
  onClick,
}: {
  onlineCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-3d-dark flex h-14 items-center justify-between gap-2.5 rounded-md px-5 text-[15px] font-semibold text-white ring-1 ring-white/5"
    >
      <span className="flex items-center gap-2.5">
        <Swords className="h-5 w-5" strokeWidth={2} />
        Battle a Player
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-brand-lime shadow-[0_0_6px_rgba(129,182,76,0.6)]" />
        <span className="text-[12px] font-bold tabular-nums text-brand-lime">
          {onlineCount}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
          online
        </span>
      </span>
    </button>
  );
}

function SecondaryAction({
  Icon,
  label,
  disabled,
}: {
  Icon: typeof Plus;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="btn-3d-dark flex h-14 items-center justify-center gap-2.5 rounded-md text-[15px] font-semibold text-white ring-1 ring-white/5"
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      {label}
    </button>
  );
}
