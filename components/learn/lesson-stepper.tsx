"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Chessboard } from "react-chessboard";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
  GraduationCap,
} from "lucide-react";
import { BoardFrame } from "@/components/chess/board-frame";
import { useChessTheme } from "@/components/chess/use-chess-theme";
import type { Lesson, LessonStep } from "@/lib/learn/lessons";

const ARROW_COLORS: Record<
  NonNullable<NonNullable<LessonStep["arrows"]>[number]["color"]>,
  string
> = {
  lime: "rgba(129,182,76,0.85)",
  amber: "rgba(224,170,60,0.85)",
  coral: "rgba(214,90,90,0.85)",
};

type Props = { lesson: Lesson };

/**
 * Walks the user through a lesson one slide at a time. Layout mirrors the
 * in-game shell: board centered on the left, dark-paneled right rail with
 * step caption + nav controls.
 */
export function LessonStepper({ lesson }: Props) {
  const [index, setIndex] = useState(0);
  const { theme } = useChessTheme();
  const total = lesson.steps.length;
  const step = lesson.steps[index];
  const isLast = index === total - 1;

  const orientation: "white" | "black" =
    step.side === "b" ? "black" : "white";

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const out: Record<string, React.CSSProperties> = {};
    for (const sq of step.highlight ?? []) {
      out[sq] = {
        background: "rgba(129,182,76,0.45)",
        boxShadow: "inset 0 0 0 3px rgba(129,182,76,0.85)",
      };
    }
    return out;
  }, [step.highlight]);

  const arrowOverlays = step.arrows ?? [];

  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)_400px] bg-navy-950">
      {/* Center: board + lesson title */}
      <div className="flex min-w-0 flex-col gap-4 p-6">
        <Link
          href="/learn"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-navy-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          All lessons
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-extrabold tracking-tight text-white">
            {lesson.title}
          </h1>
          <span className="text-[11px] uppercase tracking-wider text-navy-400">
            Step {index + 1} / {total}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-2">
          <div className="relative aspect-square w-full max-w-[640px]">
            <BoardFrame>
              <Chessboard
                options={{
                  position: step.fen,
                  allowDragging: false,
                  animationDurationInMs: 250,
                  boardOrientation: orientation,
                  darkSquareStyle: { backgroundColor: theme.dark },
                  lightSquareStyle: { backgroundColor: theme.light },
                  squareStyles,
                  boardStyle: { borderRadius: 0 },
                }}
              />
            </BoardFrame>
            {arrowOverlays.length > 0 && (
              <ArrowOverlay
                arrows={arrowOverlays}
                flipped={orientation === "black"}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right rail: caption + nav */}
      <aside className="flex flex-col border-l border-white/5 bg-navy-900">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
            <GraduationCap className="h-4 w-4 text-brand-lime" strokeWidth={2.25} />
            Lesson
          </div>
          <span className="text-[11px] uppercase tracking-wider text-navy-400">
            {Math.round(((index + 1) / total) * 100)}%
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-1">
            {lesson.steps.map((_, i) => {
              const done = i < index;
              const active = i === index;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    active
                      ? "bg-brand-lime"
                      : done
                        ? "bg-brand-lime/40"
                        : "bg-white/10 hover:bg-white/20"
                  }`}
                />
              );
            })}
          </div>

          <div className="rounded-md bg-navy-800 p-4 ring-1 ring-white/5">
            <p className="text-[14px] leading-relaxed text-white">
              {step.caption}
            </p>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="btn-3d-dark flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-[13px] font-semibold text-white ring-1 ring-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              Previous
            </button>
            {isLast ? (
              <Link
                href="/learn"
                className="btn-3d-lime flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-[13px] font-bold text-navy-950"
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Finish
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                className="btn-3d-lime flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-[13px] font-bold text-navy-950"
              >
                Next
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/**
 * SVG overlay drawing arrows on top of the board. react-chessboard@5
 * doesn't expose a public arrow API, so we render our own absolutely
 * positioned overlay sized to match the BoardFrame above it.
 */
function ArrowOverlay({
  arrows,
  flipped,
}: {
  arrows: NonNullable<LessonStep["arrows"]>;
  flipped: boolean;
}) {
  function toXY(sq: string): { x: number; y: number } {
    const file = "abcdefgh".indexOf(sq[0]);
    const rank = parseInt(sq[1], 10) - 1;
    const fx = flipped ? 7 - file : file;
    const fy = flipped ? rank : 7 - rank;
    return { x: fx * 12.5 + 6.25, y: fy * 12.5 + 6.25 };
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      {arrows.map((a, i) => {
        const from = toXY(a.from);
        const to = toXY(a.to);
        const color = ARROW_COLORS[a.color ?? "lime"];
        return (
          <g key={i}>
            <defs>
              <marker
                id={`arrow-${i}`}
                markerWidth="4"
                markerHeight="4"
                refX="3"
                refY="2"
                orient="auto"
              >
                <polygon points="0 0, 4 2, 0 4" fill={color} />
              </marker>
            </defs>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth="1.6"
              strokeLinecap="round"
              markerEnd={`url(#arrow-${i})`}
            />
          </g>
        );
      })}
    </svg>
  );
}
