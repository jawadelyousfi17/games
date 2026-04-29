"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { GameReviewClient } from "./game-review-page";
import { loadBotReview, type BotReviewSnapshot } from "@/lib/chess/bot-review-storage";
import type { GameSnapshot } from "@/actions/games/chess/get-game";

/**
 * Hydrates the bot-review walk-through from sessionStorage. If no game is
 * stashed (user hit the URL directly, or sessionStorage was cleared), shows
 * an empty state pointing back to the lobby.
 */
export function BotReviewClient() {
  const [snapshot, setSnapshot] = useState<BotReviewSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSnapshot(loadBotReview());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="grid h-screen place-items-center bg-navy-950 text-navy-200">
        <span className="text-[13px]">Loading review…</span>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="grid h-screen place-items-center bg-navy-950 text-navy-100">
        <div className="flex max-w-[420px] flex-col items-center gap-4 px-6 text-center">
          <Bot className="h-10 w-10 text-brand-lime" strokeWidth={2} />
          <h1 className="text-[22px] font-extrabold text-white">
            No bot game to review
          </h1>
          <p className="text-[13px] text-navy-300">
            Finish a game against the bot to unlock the engine-graded
            walk-through.
          </p>
          <Link
            href="/games/chess/play/bot"
            className="btn-3d-lime flex h-11 items-center justify-center rounded-md px-5 text-[13px] font-bold text-navy-950"
          >
            Play vs Bot
          </Link>
        </div>
      </div>
    );
  }

  // BotReviewSnapshot is a structural subset of GameSnapshot — cast through
  // the shared shape.
  const asGameSnapshot: GameSnapshot = {
    id: snapshot.id,
    white: snapshot.white,
    black: snapshot.black,
    myColor: snapshot.myColor,
    state: snapshot.state,
    finished: true,
  };

  return <GameReviewClient snapshot={asGameSnapshot} />;
}
