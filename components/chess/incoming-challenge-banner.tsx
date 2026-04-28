"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptChessChallenge } from "@/actions/games/chess/accept-challenge";
import { declineChessChallenge } from "@/actions/games/chess/decline-challenge";
import {
  getMyPendingChallenges,
  type PendingChallenge,
} from "@/actions/games/chess/get-pending-challenges";

/**
 * Global toast that pops in for incoming chess challenges. Lives at the
 * Shell level so it appears on every page. Listens for socket events on the
 * authenticated user's room (joined automatically by server.ts) and also
 * hydrates pending challenges on mount.
 *
 * Stacks multiple incoming challenges as cards so the user can accept the
 * one they want and decline the rest.
 */
export function IncomingChallengeBanner() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<PendingChallenge[]>([]);

  // Hydrate on mount — covers the case where a challenge was sent while
  // the user was on a page without socket subscription.
  useEffect(() => {
    let cancelled = false;
    void getMyPendingChallenges().then((rows) => {
      if (!cancelled) setChallenges(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to direct-room events.
  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    socket.on("challenge:incoming", (payload: PendingChallenge) => {
      setChallenges((prev) =>
        prev.some((c) => c.challengeId === payload.challengeId)
          ? prev
          : [payload, ...prev],
      );
    });
    socket.on(
      "challenge:resolved",
      (payload: {
        challengeId: string;
        status: "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
        gameId?: string;
      }) => {
        setChallenges((prev) =>
          prev.filter((c) => c.challengeId !== payload.challengeId),
        );
        if (payload.status === "ACCEPTED" && payload.gameId) {
          router.push(`/games/chess/play/${payload.gameId}`);
        }
      },
    );
    return () => {
      socket.disconnect();
    };
  }, [router]);

  const onAccept = useCallback(
    async (challengeId: string) => {
      const res = await acceptChessChallenge(challengeId);
      setChallenges((prev) =>
        prev.filter((c) => c.challengeId !== challengeId),
      );
      if (res.ok && res.gameId) {
        router.push(`/games/chess/play/${res.gameId}`);
      }
    },
    [router],
  );

  const onDecline = useCallback(async (challengeId: string) => {
    setChallenges((prev) =>
      prev.filter((c) => c.challengeId !== challengeId),
    );
    await declineChessChallenge(challengeId);
  }, []);

  if (challenges.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-[360px] flex-col gap-3 md:bottom-6 md:right-6">
      {challenges.map((c) => (
        <ChallengeCard
          key={c.challengeId}
          challenge={c}
          onAccept={() => onAccept(c.challengeId)}
          onDecline={() => onDecline(c.challengeId)}
        />
      ))}
    </div>
  );
}

function ChallengeCard({
  challenge,
  onAccept,
  onDecline,
}: {
  challenge: PendingChallenge;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    secondsUntil(challenge.expiresAt),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft(secondsUntil(challenge.expiresAt));
    }, 500);
    return () => clearInterval(id);
  }, [challenge.expiresAt]);

  const tcLabel = formatTimeControl(challenge.initialMs, challenge.incrementMs);

  return (
    <div className="pointer-events-auto rounded-2xl bg-navy-900 p-4 ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand-lime">
          <Swords className="h-4 w-4" strokeWidth={2.25} />
          Challenge · {secondsLeft}s
        </div>
        <button
          type="button"
          onClick={onDecline}
          aria-label="Dismiss"
          className="flex h-6 w-6 items-center justify-center rounded text-navy-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="text-[15px] font-bold text-white">
        {challenge.challengerLogin}{" "}
        <span className="text-[12px] font-semibold text-navy-300">
          ({challenge.challengerRating})
        </span>
      </div>
      <div className="mt-0.5 text-[13px] text-navy-200">
        wants to play <span className="font-semibold text-white">{tcLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={onDecline}>
          Decline
        </Button>
        <Button type="button" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
}

function formatTimeControl(initialMs: number, incrementMs: number): string {
  const minutes = Math.round(initialMs / 60000);
  if (incrementMs === 0) return `${minutes} min`;
  return `${minutes}+${Math.round(incrementMs / 1000)}`;
}
