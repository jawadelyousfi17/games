import Link from "next/link";
import { Shell } from "@/components/shell/shell";
import { LobbyBoardPreview } from "@/components/chess/lobby-board-preview";
import { auth } from "@/lib/auth/auth-provider";

const GAMES = [
  {
    href: "/games/chess",
    name: "Chess",
    sub: "Blitz · 5 min · Elo-ranked",
    accent: "bg-[#769656]",
    glyph: "♞",
    available: true,
  },
];

/** Public landing page. Sits inside the chess.com-style shell. */
export default async function Page() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  return (
    <Shell>
      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-navy-300">
                For 1337 students
              </div>
              <h1 className="mt-3 text-[clamp(40px,5vw,64px)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white">
                A small games club
                <br />
                between two pushes.
              </h1>
              <p className="mt-5 max-w-[440px] text-[15px] text-navy-200">
                Sign in with your intra and queue up. Chess is live. Uno and
                Poker are coming.
              </p>
              <div className="mt-7 flex items-center gap-3">
                <Link
                  href="/games/chess"
                  className="btn-3d-lime inline-flex h-12 items-center justify-center rounded-md px-6 text-[14px] font-bold text-navy-950"
                >
                  Play Chess
                </Link>
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="btn-3d-dark inline-flex h-12 items-center justify-center rounded-md px-6 text-[14px] font-semibold text-white ring-1 ring-white/10"
                  >
                    Sign in with intra
                  </Link>
                )}
              </div>
            </div>

            <div className="aspect-square w-full max-w-[480px] justify-self-end">
              <LobbyBoardPreview />
            </div>
          </div>

          <section className="mt-16">
            <h2 className="mb-4 text-[11px] uppercase tracking-wider text-navy-400">
              Games
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {GAMES.map((g) => {
                const Inner = (
                  <div
                    className={`flex items-center gap-4 rounded-md bg-navy-900 p-4 ring-1 ring-white/5 transition ${
                      g.available
                        ? "hover:bg-navy-800"
                        : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md text-[24px] font-bold text-white ${g.accent}`}
                    >
                      {g.glyph}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold text-white">
                        {g.name}
                      </div>
                      <div className="truncate text-[12px] text-navy-300">
                        {g.sub}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        g.available ? "text-brand-lime" : "text-navy-400"
                      }`}
                    >
                      {g.available ? "Live" : "Soon"}
                    </span>
                  </div>
                );
                return g.available ? (
                  <Link key={g.name} href={g.href}>
                    {Inner}
                  </Link>
                ) : (
                  <div key={g.name}>{Inner}</div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
