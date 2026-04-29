import Link from "next/link";
import { Shell } from "@/components/shell/shell";
import { PuzzleBoard } from "@/components/chess/puzzle-board";
import { fetchPuzzleById } from "@/lib/chess/puzzles-api";

type Props = { params: Promise<{ id: string }> };

/** /puzzles/[id] — solve a specific Lichess puzzle by id. */
export default async function PuzzleByIdPage({ params }: Props) {
  const { id } = await params;
  let puzzle;
  let error: string | null = null;
  try {
    puzzle = await fetchPuzzleById(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown";
  }

  return (
    <Shell>
      <div className="min-h-screen bg-navy-950">
        {puzzle ? (
          <PuzzleBoard puzzle={puzzle} nextHref="/puzzles" />
        ) : (
          <div className="grid h-screen place-items-center text-center">
            <div className="max-w-[420px] px-6">
              <h1 className="text-[22px] font-extrabold text-white">
                Puzzle not found
              </h1>
              <p className="mt-2 text-[13px] text-navy-300">{error}</p>
              <Link
                href="/puzzles"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-navy-800 px-4 text-[13px] font-semibold text-white ring-1 ring-white/10"
              >
                Try the daily puzzle
              </Link>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
