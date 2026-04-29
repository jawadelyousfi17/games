"use server";

import { fetchDailyPuzzle, type Puzzle } from "@/lib/chess/puzzles-api";

/** Server action wrapper so client components can call into the Lichess
 *  fetcher without each one importing the API module directly. */
export async function getDailyPuzzle(): Promise<Puzzle> {
  return fetchDailyPuzzle();
}
