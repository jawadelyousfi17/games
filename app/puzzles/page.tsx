import Link from "next/link";
import { Shell } from "@/components/shell/shell";
import { PuzzleBoard } from "@/components/chess/puzzle-board";
import { fetchNextPuzzle } from "@/lib/chess/puzzles-api";

// Server component renders a fresh random puzzle on every visit. The "Next
// puzzle" button on the client triggers router.refresh() which re-runs this
// component → new puzzle.
export const dynamic = "force-dynamic";

/**
 * /puzzles — random puzzle from Lichess. Hit "Next puzzle" to roll another.
 */
export default async function PuzzlesPage() {
  let puzzle;
  let error: string | null = null;
  try {
    puzzle = await fetchNextPuzzle();
    console.info("[puzzles-page] fetched", { id: puzzle.id, fen: puzzle.fen });
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown";
    console.error("[puzzles-page] fetch failed", e);
  }

  return (
    <Shell>
      <div className="min-h-screen bg-navy-950">
        {puzzle ? (
          <PuzzleBoard puzzle={puzzle} showNext />
        ) : (
          <div className="grid h-screen place-items-center text-center">
            <div className="max-w-[420px] px-6">
              <h1 className="text-[22px] font-extrabold text-white">
                Puzzle unavailable
              </h1>
              <p className="mt-2 text-[13px] text-navy-300">
                Could not reach Lichess right now ({error}). Please try again.
              </p>
              <Link
                href="/games/chess"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-navy-800 px-4 text-[13px] font-semibold text-white ring-1 ring-white/10"
              >
                Back to chess
              </Link>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
