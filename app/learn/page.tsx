import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Shell } from "@/components/shell/shell";
import {
  CATEGORY_LABEL,
  LESSONS,
  type LessonCategory,
} from "@/lib/learn/lessons";

const CATEGORY_ORDER: LessonCategory[] = [
  "basics",
  "openings",
  "tactics",
  "endgames",
];

/** Per-category accent + glyph used on each lesson card's leading tile.
 *  Mirrors the landing-page `Games` card pattern so Learn looks at home. */
const CATEGORY_GLYPH: Record<
  LessonCategory,
  { glyph: string; accent: string; tint: string }
> = {
  basics: { glyph: "♟", accent: "bg-[#769656]", tint: "text-brand-lime" },
  openings: { glyph: "♞", accent: "bg-sky-700", tint: "text-sky-300" },
  tactics: { glyph: "♛", accent: "bg-amber-700", tint: "text-amber-300" },
  endgames: { glyph: "♚", accent: "bg-[#7a4a26]", tint: "text-brand-coral" },
};

/** /learn — list of curated chess lessons grouped by category. */
export default function LearnPage() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    lessons: LESSONS.filter((l) => l.category === cat),
  })).filter((g) => g.lessons.length > 0);

  return (
    <Shell>
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)_360px] bg-navy-950">
        <div className="flex min-w-0 flex-col gap-8 p-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-extrabold tracking-tight text-white">
              Learn
            </h1>
            <span className="text-[12px] text-navy-300">
              Bite-sized lessons
            </span>
          </div>

          {grouped.map(({ cat, lessons }) => (
            <section key={cat}>
              <h2 className="mb-3 text-[11px] uppercase tracking-wider text-navy-400">
                {CATEGORY_LABEL[cat]}
              </h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {lessons.map((l) => {
                  const meta = CATEGORY_GLYPH[l.category];
                  return (
                    <li key={l.slug}>
                      <Link
                        href={`/learn/${l.slug}`}
                        className="flex items-center gap-4 rounded-md bg-navy-900 p-4 ring-1 ring-white/5 transition hover:bg-navy-800"
                      >
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md text-[24px] font-bold text-white ${meta.accent}`}
                        >
                          {meta.glyph}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-bold text-white">
                            {l.title}
                          </div>
                          <div className="truncate text-[12px] text-navy-300">
                            {l.blurb}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] uppercase tracking-wider ${meta.tint}`}
                        >
                          {l.durationMin} min
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="hidden border-l border-white/5 bg-navy-900 lg:flex lg:flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div className="text-[14px] font-semibold text-white">About</div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-lime/15 text-brand-lime">
                <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white">
                  Hand-picked lessons
                </div>
                <div className="text-[11px] text-navy-300">
                  {LESSONS.length} lessons · {totalSteps()} steps
                </div>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-navy-300">
              Each lesson is a short slideshow — read the caption, click Next.
              Practice what you learn against the bot or jump into a live game.
            </p>
            <div className="mt-auto flex flex-col gap-2">
              <Link
                href="/games/chess/play/bot"
                className="btn-3d-lime flex h-11 items-center justify-center rounded-md text-[13px] font-bold text-navy-950"
              >
                Play vs Bot
              </Link>
              <Link
                href="/puzzles"
                className="btn-3d-dark flex h-11 items-center justify-center rounded-md text-[13px] font-semibold text-white ring-1 ring-white/10"
              >
                Try a puzzle
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function totalSteps(): number {
  return LESSONS.reduce((sum, l) => sum + l.steps.length, 0);
}
