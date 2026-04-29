import { Chess } from "chess.js";

/**
 * Lichess puzzle adapter. Free, CC0 — no API key needed. We hit two
 * endpoints:
 *
 *   - GET /api/puzzle/daily         — refreshes once per day at Lichess
 *   - GET /api/puzzle/{id}          — fetch a specific puzzle by id
 *
 * Each endpoint returns a JSON envelope with the game's PGN plus the
 * puzzle's solution as a list of UCI moves. We replay the PGN with chess.js
 * to derive the starting FEN, then the client only needs (fen, solution).
 */

export type Puzzle = {
  id: string;
  fen: string;
  /** Alternating UCI moves: user → opponent → user → … */
  solution: string[];
  rating: number;
  themes: string[];
  /** Side that the user plays. Determined from the starting FEN. */
  sideToMove: "w" | "b";
  /** Lichess permalink so the user can dive deeper. */
  externalUrl: string;
};

type LichessPuzzleResponse = {
  game: { id: string; pgn: string };
  puzzle: {
    id: string;
    rating: number;
    initialPly: number;
    solution: string[];
    themes: string[];
    /** Some endpoints embed the puzzle FEN directly. Prefer it over the
     *  PGN replay since it skips one parser pass. */
    fen?: string;
  };
};

/**
 * Cached daily puzzle. Lichess rotates the daily puzzle around midnight UTC,
 * so we key the cache by the calendar date (UTC) and refetch on rollover.
 */
let dailyCache: { date: string; puzzle: Puzzle } | null = null;

function utcDateKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

export async function fetchDailyPuzzle(): Promise<Puzzle> {
  const key = utcDateKey();
  if (dailyCache && dailyCache.date === key) {
    console.info("[puzzles] daily cache hit", { date: key, id: dailyCache.puzzle.id });
    return dailyCache.puzzle;
  }

  console.info("[puzzles] fetching daily from Lichess", { date: key });
  let res: Response;
  try {
    res = await fetch("https://lichess.org/api/puzzle/daily", {
      next: { revalidate: 60 * 60 },
    });
  } catch (err) {
    console.error("[puzzles] fetch threw", err);
    throw err;
  }
  console.info("[puzzles] response", { status: res.status, ok: res.ok });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[puzzles] non-2xx", { status: res.status, body: body.slice(0, 200) });
    throw new Error(`Lichess daily puzzle ${res.status}`);
  }
  let data: LichessPuzzleResponse;
  try {
    data = (await res.json()) as LichessPuzzleResponse;
  } catch (err) {
    console.error("[puzzles] json parse failed", err);
    throw err;
  }
  console.info("[puzzles] decoded", {
    puzzleId: data.puzzle?.id,
    rating: data.puzzle?.rating,
    solutionLen: data.puzzle?.solution?.length,
    fenPresent: !!data.puzzle?.fen,
    pgnLen: data.game?.pgn?.length,
  });
  const puzzle = adaptLichessPuzzle(data);
  console.info("[puzzles] adapted", {
    id: puzzle.id,
    fen: puzzle.fen,
    sideToMove: puzzle.sideToMove,
  });
  dailyCache = { date: key, puzzle };
  return puzzle;
}

/**
 * Pulls a fresh random puzzle from Lichess. Bypasses every cache so each
 * call returns a different one — that's the whole point.
 *
 * @param angle  Optional theme/opening filter, e.g. "mateIn2", "fork".
 *               See https://lichess.org/training/themes for the list.
 * @param difficulty  "easiest" | "easier" | "normal" | "harder" | "hardest"
 */
export async function fetchNextPuzzle(opts?: {
  angle?: string;
  difficulty?: "easiest" | "easier" | "normal" | "harder" | "hardest";
}): Promise<Puzzle> {
  const params = new URLSearchParams();
  if (opts?.angle) params.set("angle", opts.angle);
  if (opts?.difficulty) params.set("difficulty", opts.difficulty);
  const qs = params.toString();
  const url = `https://lichess.org/api/puzzle/next${qs ? `?${qs}` : ""}`;
  console.info("[puzzles] fetching next", { url });
  const res = await fetch(url, { cache: "no-store" });
  console.info("[puzzles] next response", { status: res.status, ok: res.ok });
  if (!res.ok) {
    throw new Error(`Lichess next puzzle ${res.status}`);
  }
  const data: LichessPuzzleResponse = await res.json();
  return adaptLichessPuzzle(data);
}

export async function fetchPuzzleById(id: string): Promise<Puzzle> {
  console.info("[puzzles] fetching by id", { id });
  const res = await fetch(`https://lichess.org/api/puzzle/${id}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  console.info("[puzzles] response", { id, status: res.status, ok: res.ok });
  if (!res.ok) {
    throw new Error(`Lichess puzzle ${id} ${res.status}`);
  }
  const data: LichessPuzzleResponse = await res.json();
  return adaptLichessPuzzle(data);
}

function adaptLichessPuzzle(data: LichessPuzzleResponse): Puzzle {
  // Prefer the FEN embedded in the puzzle envelope. Fall back to replaying
  // the PGN with chess.js (its loadPgn handles Lichess's bare move list).
  let fen = data.puzzle.fen;
  if (!fen) {
    const chess = new Chess();
    chess.loadPgn(data.game.pgn);
    fen = chess.fen();
  }
  const sideToMove: "w" | "b" = fen.split(" ")[1] === "b" ? "b" : "w";
  return {
    id: data.puzzle.id,
    fen,
    solution: data.puzzle.solution,
    rating: data.puzzle.rating,
    themes: data.puzzle.themes,
    sideToMove,
    externalUrl: `https://lichess.org/training/${data.puzzle.id}`,
  };
}
