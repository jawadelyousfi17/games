"use client";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Error boundary for online chess games (bad id, kicked, etc.). */
export default function OnlineChessError({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-navy-950 text-navy-50">
      <div className="mx-auto flex max-w-[640px] flex-col items-start gap-4 px-6 py-16">
        <h1 className="text-[24px] font-extrabold text-white">
          Could not open this game.
        </h1>
        <p className="text-[12px] text-navy-300">
          {error.message || "Unknown error"}
        </p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
