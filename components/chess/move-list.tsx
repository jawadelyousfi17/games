"use client";

import type { Quality } from "@/lib/chess/move-quality";
import { MoveQualityBadge } from "./move-quality-badge";

type MoveListProps = {
  /** Move history in SAN notation, ply-ordered (white, black, white, black, …). */
  history: string[];
  /** Per-ply quality classification, indexed by 0-based ply. */
  qualities?: Array<Quality | null>;
  /** Currently viewed ply (-1 = starting position). Highlights the matching cell. */
  currentPly?: number;
  /** Click a move to seek to that ply. */
  onSeek?: (ply: number) => void;
};

/**
 * chess.com-style move list: numbered rows, alternating background, white SAN
 * on the left and black SAN on the right. Renders quality dots when the
 * review hook has resolved them, and highlights the move that matches
 * `currentPly` so the walk-through stays visually anchored.
 */
export function MoveList({
  history,
  qualities,
  currentPly = history.length - 1,
  onSeek,
}: MoveListProps) {
  const rows: { num: number; whitePly: number; blackPly?: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: i / 2 + 1,
      whitePly: i,
      blackPly: i + 1 < history.length ? i + 1 : undefined,
    });
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-[13px] font-medium text-navy-400">
        Game starts with white&apos;s move.
      </div>
    );
  }

  return (
    <ol>
      {rows.map((r, i) => (
        <li
          key={r.num}
          className={`grid grid-cols-[2.5rem_1fr_1fr] gap-3 px-3 py-2 text-[14px] ${
            i % 2 === 0 ? "bg-white/[0.03]" : ""
          }`}
        >
          <span className="font-semibold text-navy-400">
            {r.num}.
          </span>
          <Cell
            ply={r.whitePly}
            san={history[r.whitePly]}
            quality={qualities?.[r.whitePly] ?? null}
            current={r.whitePly === currentPly}
            color="white"
            onSeek={onSeek}
          />
          {r.blackPly !== undefined ? (
            <Cell
              ply={r.blackPly}
              san={history[r.blackPly]}
              quality={qualities?.[r.blackPly] ?? null}
              current={r.blackPly === currentPly}
              color="black"
              onSeek={onSeek}
            />
          ) : (
            <span />
          )}
        </li>
      ))}
    </ol>
  );
}

function Cell({
  ply,
  san,
  quality,
  current,
  color,
  onSeek,
}: {
  ply: number;
  san: string;
  quality: Quality | null;
  current: boolean;
  color: "white" | "black";
  onSeek?: (ply: number) => void;
}) {
  const sanColor = color === "white" ? "text-white" : "text-navy-100";
  const inner = (
    <>
      <span className={`font-semibold ${sanColor}`}>{san}</span>
      {quality && <MoveQualityBadge quality={quality} compact />}
    </>
  );

  if (!onSeek) {
    return <span className="flex items-center gap-2">{inner}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onSeek(ply)}
      className={`flex items-center gap-2 rounded px-1 text-left transition hover:bg-white/[0.05] ${
        current ? "bg-brand-lime/15 text-white" : ""
      }`}
    >
      {inner}
    </button>
  );
}
