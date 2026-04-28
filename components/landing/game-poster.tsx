import Link from "next/link";
import type { ReactNode } from "react";

type GamePosterProps = {
  name: string;
  sub: string;
  players: string;
  /** Full CSS background expression for the poster body. */
  bg: string;
  /** Decorative artwork rendered in the upper region. */
  art: ReactNode;
  /** Where the poster click navigates. Defaults to /login. */
  href?: string;
};

/**
 * Minimal game card: artwork + title + sub + players.
 * Whole card is the click target.
 */
export function GamePoster({
  name,
  sub,
  players,
  bg,
  art,
  href = "/login",
}: GamePosterProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl ring-1 ring-white/5 transition hover:-translate-y-1 hover:ring-white/10"
      style={{ background: bg }}
    >
      <div className="relative h-[230px] overflow-hidden">{art}</div>
      <div className="flex items-end justify-between gap-4 p-5 pt-4">
        <div className="min-w-0">
          <h3 className="text-[22px] font-extrabold tracking-tight text-white">
            {name}
          </h3>
          <div className="mt-0.5 text-[12px] text-white/60">{sub}</div>
        </div>
        <div className="text-[11px] text-white/60">{players}</div>
      </div>
    </Link>
  );
}
