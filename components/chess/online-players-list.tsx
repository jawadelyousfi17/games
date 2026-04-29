"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Search, Swords } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  getOnlinePlayers,
  type OnlinePlayer,
} from "@/actions/users/get-online-players";
import {
  searchUsers,
  type FoundUser,
} from "@/actions/users/search-users";
import { sendChessChallenge } from "@/actions/games/chess/send-challenge";
import {
  DEFAULT_TIME_CONTROL_ID,
  TIME_CONTROLS,
  type TimeControlId,
} from "@/lib/chess/time-controls";

type Row = OnlinePlayer & { online: boolean };

/**
 * Lobby Players tab. Lists who's online (auto-updates via socket events) and
 * exposes a search box to find any user by login. Each row has a Challenge
 * button that opens a time-control popover and sends the challenge.
 */
export function OnlinePlayersList() {
  const [online, setOnline] = useState<Row[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [tcId, setTcId] = useState<TimeControlId>(DEFAULT_TIME_CONTROL_ID);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Initial fetch of online users.
  useEffect(() => {
    let cancelled = false;
    void getOnlinePlayers().then((rows) => {
      if (cancelled) return;
      setOnline(rows.map((r) => ({ ...r, online: true })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to user:online / user:offline. On any transition we refetch
  // the canonical list — small + cheap, avoids hand-rolled merges. A 15s
  // background tick also runs so playing/online flips when games start or
  // end (no dedicated socket event for those transitions yet).
  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    const refresh = async () => {
      const rows = await getOnlinePlayers();
      setOnline(rows.map((r) => ({ ...r, online: true })));
    };
    socket.on("user:online", refresh);
    socket.on("user:offline", refresh);

    const tick = setInterval(refresh, 15_000);
    return () => {
      clearInterval(tick);
      socket.disconnect();
    };
  }, []);

  // Debounced search across all users by login prefix.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const rows = await searchUsers(q);
        setSearchResults(rows);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const onChallenge = useCallback(
    async (userId: string) => {
      setBusyId(userId);
      try {
        await sendChessChallenge(userId, tcId);
      } finally {
        setBusyId(null);
      }
    },
    [tcId],
  );

  const showSearchResults = searchQuery.trim().length >= 2;
  const rowsToRender = useMemo<Row[]>(() => {
    if (showSearchResults) {
      return searchResults.map((r) => ({
        id: r.id,
        login: r.login,
        image: r.image,
        rating: r.rating,
        playing: r.playing,
        online: r.online,
      }));
    }
    return online;
  }, [showSearchResults, searchResults, online]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
          strokeWidth={2}
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find a player by login…"
          className="h-11 w-full rounded-md bg-navy-800 pl-9 pr-3 text-[13px] text-white ring-1 ring-white/5 placeholder:text-navy-400 focus:outline-none focus:ring-white/10"
        />
      </div>

      <TimeControlInline value={tcId} onChange={setTcId} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {searching ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : rowsToRender.length === 0 ? (
          <div className="px-2 py-8 text-center text-[13px] text-navy-400">
            {showSearchResults ? "No matches." : "No one else online."}
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rowsToRender.map((row) => (
              <li key={row.id}>
                <PlayerRow
                  row={row}
                  busy={busyId === row.id}
                  onChallenge={() => onChallenge(row.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TimeControlInline({
  value,
  onChange,
}: {
  value: TimeControlId;
  onChange: (id: TimeControlId) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-navy-800 p-1 ring-1 ring-white/5">
      {TIME_CONTROLS.map((tc) => (
        <button
          key={tc.id}
          type="button"
          onClick={() => onChange(tc.id)}
          className={`flex h-8 flex-1 items-center justify-center rounded text-[12px] font-semibold transition ${
            value === tc.id
              ? "bg-white/[0.08] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]"
              : "text-navy-300 hover:text-white"
          }`}
        >
          {tc.label}
        </button>
      ))}
    </div>
  );
}

function PlayerRow({
  row,
  busy,
  onChallenge,
}: {
  row: Row;
  busy: boolean;
  onChallenge: () => void;
}) {
  // "playing" beats "online" — a busy player can't accept a fresh challenge,
  // so disable the button and surface the in-game state in the chip.
  const status: "playing" | "online" | "offline" = row.playing
    ? "playing"
    : row.online
      ? "online"
      : "offline";
  const chip = STATUS_CHIPS[status];
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-navy-800 px-2.5 py-2 ring-1 ring-white/5">
      <Avatar className="h-8 w-8 rounded-md border border-white/10">
        {row.image ? <AvatarImage src={row.image} alt={row.login} /> : null}
        <AvatarFallback className="rounded-md bg-navy-700 text-[11px] font-bold text-white">
          {row.login.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-white">
            {row.login}
          </span>
          <span
            title={chip.title}
            className={`flex items-center gap-1 rounded-sm px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ${chip.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${chip.dotClass}`} />
            {chip.label}
          </span>
        </div>
        <div className="text-[11px] text-navy-300">{row.rating}</div>
      </div>
      <button
        type="button"
        onClick={onChallenge}
        disabled={busy || row.playing}
        title={row.playing ? "Already in a game" : "Challenge"}
        className="flex h-9 items-center gap-1.5 rounded-md bg-brand-lime px-3 text-[12px] font-bold text-navy-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.22)] transition hover:bg-brand-lime-light active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] disabled:opacity-50"
      >
        {busy ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : (
          <Swords className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        Play
      </button>
    </div>
  );
}

const STATUS_CHIPS = {
  playing: {
    label: "Playing",
    title: "In a game",
    className: "bg-brand-coral/15 text-brand-coral",
    dotClass: "bg-brand-coral shadow-[0_0_4px_rgba(214,90,90,0.6)]",
  },
  online: {
    label: "Online",
    title: "Online",
    className: "bg-brand-lime/15 text-brand-lime",
    dotClass: "bg-brand-lime shadow-[0_0_4px_rgba(129,182,76,0.6)]",
  },
  offline: {
    label: "Offline",
    title: "Offline",
    className: "bg-white/[0.06] text-navy-300",
    dotClass: "bg-navy-500",
  },
} as const;
