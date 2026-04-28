"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { enqueueChess } from "@/actions/games/chess/enqueue";
import { leaveChessQueue } from "@/actions/games/chess/leave-queue";
import { getMyChessMatch } from "@/actions/games/chess/get-my-match";
import type { TimeControlId } from "@/lib/chess/time-controls";

type QueueState = "idle" | "queueing" | "queued" | "matched";

const POLL_INTERVAL_MS = 2000;

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
      const result = await enqueueChess(timeControlId);
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
