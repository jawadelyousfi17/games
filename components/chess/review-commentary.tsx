"use client";

import { Star, ThumbsUp, AlertCircle, BookOpen } from "lucide-react";
import { uciToSan } from "@/lib/chess/uci-to-san";
import { QUALITY_META, type Quality } from "@/lib/chess/move-quality";
import type { GameReview } from "./use-game-review";

type ReviewCommentaryProps = {
  review: GameReview;
  /** Currently focused ply (0-based). -1 = starting position (no move yet). */
  currentPly: number;
};

const COMMENTARY: Record<Quality, string> = {
  book: "Opening theory. A well-known move from established lines.",
  best: "Top engine choice. No stronger move available.",
  good: "Strong move. Maintains the game's balance.",
  inaccuracy: "Slightly off. The engine prefers a different idea.",
  mistake: "This drops material or initiative.",
  blunder: "A serious blunder — your position takes a heavy hit.",
};

const COLOR_LABEL: Record<"w" | "b", string> = {
  w: "White",
  b: "Black",
};

/**
 * Per-move analysis card for the dedicated game-review screen.
 *
 * Pulls everything from the GameReview hook: classification, eval delta,
 * and the engine's preferred move (UCI → SAN converted in-place). Renders a
 * sensible placeholder while the engine still hasn't reached this ply.
 */
export function ReviewCommentary({
  review,
  currentPly,
}: ReviewCommentaryProps) {
  const { positions, qualities, evals, bestMoves } = review;

  if (currentPly < 0) {
    return (
      <Card>
        <Header
          color="—"
          ply={0}
          icon={<BookOpen className="h-4 w-4" strokeWidth={2} />}
          accent="#9a9994"
        />
        <p className="text-[14px] leading-snug text-navy-200">
          Starting position. Step forward to walk through the game.
        </p>
      </Card>
    );
  }

  const move = positions.moves[currentPly];
  if (!move) return null;

  const fenBefore = positions.fens[currentPly];
  const fenAfter = positions.fens[currentPly + 1];
  const mover: "w" | "b" = currentPly % 2 === 0 ? "w" : "b";
  const quality = qualities[currentPly] ?? null;

  const evalBefore = evals[fenBefore];
  const evalAfter = evals[fenAfter];

  const bestUci = bestMoves[fenBefore] ?? null;
  const bestSan = bestUci ? uciToSan(fenBefore, bestUci) : null;
  const playedWasBest = bestUci
    ? bestUci.slice(0, 4) === `${move.from}${move.to}`
    : false;

  const meta = quality ? QUALITY_META[quality] : null;

  return (
    <Card>
      <Header
        color={COLOR_LABEL[mover]}
        ply={Math.floor(currentPly / 2) + 1}
        icon={iconFor(quality)}
        accent={meta?.color ?? "#9a9994"}
      />

      <div className="space-y-3">
        <Row label="Played">
          <span className="text-[16px] font-bold text-white">
            {move.san}
          </span>
          {meta && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          )}
        </Row>

        {!playedWasBest &&
          bestSan &&
          quality !== "best" &&
          quality !== "book" && (
            <Row label="Better">
              <span className="text-[16px] font-bold text-brand-lime">
                {bestSan}
              </span>
            </Row>
          )}

        {evalBefore !== undefined && evalAfter !== undefined && (
          <Row label="Eval">
            <span className="text-[14px] font-semibold text-white">
              {formatEval(evalBefore)}{" "}
              <span className="text-navy-400">→</span>{" "}
              {formatEval(evalAfter)}
            </span>
          </Row>
        )}

        {quality && (
          <p className="pt-1 text-[13px] leading-snug text-navy-200">
            {COMMENTARY[quality]}
          </p>
        )}

        {!quality && (
          <p className="pt-1 text-[13px] leading-snug text-navy-400">
            Engine still analyzing this move…
          </p>
        )}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-navy-850 p-5 ring-1 ring-white/5 space-y-4">
      {children}
    </div>
  );
}

function Header({
  color,
  ply,
  icon,
  accent,
}: {
  color: string;
  ply: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: `${accent}26`, color: accent }}
        >
          {icon}
        </span>
        <span className="text-[12px] font-semibold uppercase tracking-wider text-navy-300">
          Move {ply} · {color}
        </span>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[60px] text-[11px] font-semibold uppercase tracking-wider text-navy-400">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function iconFor(q: Quality | null) {
  if (!q || q === "book")
    return <BookOpen className="h-4 w-4" strokeWidth={2} />;
  if (q === "best")
    return <Star className="h-4 w-4" strokeWidth={2} fill="currentColor" />;
  if (q === "good") return <ThumbsUp className="h-4 w-4" strokeWidth={2} />;
  return <AlertCircle className="h-4 w-4" strokeWidth={2} />;
}

function formatEval(cp: number): string {
  // Mate-equivalent threshold (matches MATE_VALUE in move-quality).
  if (cp >= 9000) return "M+";
  if (cp <= -9000) return "M-";
  const pawns = cp / 100;
  return pawns >= 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
}
