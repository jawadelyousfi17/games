"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { enqueueChess } from "@/actions/games/chess/enqueue";
import { leaveChessQueue } from "@/actions/games/chess/leave-queue";
import { getMyChessMatch } from "@/actions/games/chess/get-my-match";
import type { TimeControlId } from "@/lib/chess/time-controls";

type QueueState = "idle" | "queueing" | "queued" | "matched" | "expired";

const POLL_INTERVAL_MS = 2000;
/** Mirrors QUEUE_TICKET_TTL_MS server-side. Drop the user back to idle once
 *  the ticket would have been pruned, so the UI doesn't lie. */
const SEARCH_TIMEOUT_MS = 2 * 60 * 1000;

type QueueButtonProps = {
  /** Which time-control bucket to enqueue into. */
  timeControlId: TimeControlId;
};

/**
 * Primary green "Start Game" CTA. Two states: idle → click to enqueue;
 * queued → polling for an opponent with a cancel option. Pairs only with
 * opponents in the same time-control queue.
 */
export function QueueButton({ timeControlId }: QueueButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<QueueState>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tracks whether the user currently has a live ticket. Read in unmount
   *  cleanup so we only call leaveChessQueue when the queue is actually
   *  open — never when transitioning to "matched" (which already deleted
   *  the ticket via the matchmaking transaction). */
  const hasActiveTicketRef = useRef(false);

  const isSearching = state === "queued" || state === "queueing";

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hasActiveTicketRef.current) {
        // SPA navigation while still searching → release the ticket so the
        // next opponent doesn't get matched against a phantom.
        void leaveChessQueue().catch(() => {});
        hasActiveTicketRef.current = false;
      }
    };
  }, []);

  // Tab/window close beacon — only attached while searching so it's a
  // no-op for an already-matched player navigating to their game.
  useEffect(() => {
    if (!isSearching) return;
    const sendBeacon = () => {
      try {
        navigator.sendBeacon?.("/api/chess/queue/leave");
      } catch {
        /* navigator may be undefined in some embedded contexts */
      }
    };
    window.addEventListener("beforeunload", sendBeacon);
    window.addEventListener("pagehide", sendBeacon);
    return () => {
      window.removeEventListener("beforeunload", sendBeacon);
      window.removeEventListener("pagehide", sendBeacon);
    };
  }, [isSearching]);

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const result = await getMyChessMatch();
      if (result.kind === "found") {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // Server already deleted both tickets in the matchmaking transaction.
        hasActiveTicketRef.current = false;
        setState("matched");
        router.push(`/games/chess/play/${result.gameId}`);
      } else if (result.kind === "none") {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        hasActiveTicketRef.current = false;
        setState("idle");
      }
    }, POLL_INTERVAL_MS);
  };

  const stopSearching = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const onFind = async () => {
    setState("queueing");
    try {
      const result = await enqueueChess(timeControlId);
      if (result.kind === "matched" || result.kind === "alreadyInGame") {
        // Either we matched immediately or we already had a live game —
        // server deleted any tickets it created, so no cleanup needed.
        hasActiveTicketRef.current = false;
        setState("matched");
        router.push(`/games/chess/play/${result.gameId}`);
        return;
      }
      hasActiveTicketRef.current = true;
      setState("queued");
      startPolling();
      // Auto-cancel after the search window expires. Mirrors the server-side
      // TTL so the user isn't left "Searching…" forever on a quiet day.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopSearching();
        hasActiveTicketRef.current = false;
        setState("expired");
        void leaveChessQueue().catch(() => {});
      }, SEARCH_TIMEOUT_MS);
    } catch {
      setState("idle");
    }
  };

  const onCancel = async () => {
    stopSearching();
    hasActiveTicketRef.current = false;
    setState("idle");
    await leaveChessQueue();
  };

  if (state === "queued" || state === "queueing") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="btn-3d-lime flex h-16 w-full items-center justify-center gap-2 rounded-md text-[17px] font-bold text-navy-950"
        >
          <Spinner className="h-5 w-5" />
          Searching…
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-3d-dark flex h-11 w-full items-center justify-center rounded-md text-[14px] font-semibold text-white ring-1 ring-white/10"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="space-y-2">
        <div className="rounded-md bg-navy-800 px-3 py-2 text-center text-[13px] text-navy-200 ring-1 ring-white/5">
          No opponent in 2 minutes. Try again?
        </div>
        <button
          type="button"
          onClick={onFind}
          className="btn-3d-lime flex h-16 w-full items-center justify-center rounded-md text-[17px] font-bold text-navy-950"
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onFind}
      className="btn-3d-lime flex h-16 w-full items-center justify-center rounded-md text-[17px] font-bold text-navy-950"
    >
      Start Game
    </button>
  );
}
