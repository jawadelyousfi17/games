"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { enqueueChess } from "@/actions/games/chess/enqueue";
import { leaveChessQueue } from "@/actions/games/chess/leave-queue";
import { getMyChessMatch } from "@/actions/games/chess/get-my-match";

type QueueState = "idle" | "queueing" | "queued" | "matched";

const POLL_INTERVAL_MS = 2000;

/**
 * Primary green "Start Game" CTA. Two states: idle → click to enqueue;
 * queued → polling for an opponent with a cancel option.
 *
 * Polling is the simplest viable matchmaking transport — sub-second pickup
 * would require a presence channel which isn't load-bearing for v1.
 */
export function QueueButton() {
  const router = useRouter();
  const [state, setState] = useState<QueueState>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const result = await getMyChessMatch();
      if (result.kind === "found") {
        if (pollRef.current) clearInterval(pollRef.current);
        setState("matched");
        router.push(`/games/chess/play/${result.gameId}`);
      } else if (result.kind === "none") {
        if (pollRef.current) clearInterval(pollRef.current);
        setState("idle");
      }
    }, POLL_INTERVAL_MS);
  };

  const onFind = async () => {
    setState("queueing");
    try {
      const result = await enqueueChess();
      if (result.kind === "matched" || result.kind === "alreadyInGame") {
        setState("matched");
        router.push(`/games/chess/play/${result.gameId}`);
        return;
      }
      setState("queued");
      startPolling();
    } catch {
      setState("idle");
    }
  };

  const onCancel = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setState("idle");
    await leaveChessQueue();
  };

  if (state === "queued" || state === "queueing") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="flex h-16 w-full items-center justify-center gap-2 rounded-md bg-brand-lime/40 text-[17px] font-bold text-navy-950"
        >
          <Spinner className="h-5 w-5" />
          Searching…
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 w-full items-center justify-center rounded-md bg-navy-800 text-[14px] font-semibold text-white ring-1 ring-white/10 shadow-[inset_0_-2px_0_rgba(0,0,0,0.22)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onFind}
      className="flex h-16 w-full items-center justify-center rounded-md bg-brand-lime text-[17px] font-bold text-navy-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.22)] transition hover:bg-brand-lime-light active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
    >
      Start Game
    </button>
  );
}
