import Link from "next/link";
import { t } from "@/lib/i18n";

/** Sticky landing top nav: logo + Games anchor + sign-in link. */
export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-lime text-[13px] font-bold text-navy-950">
            42
          </div>
          <span className="text-[16px] font-bold tracking-tight">
            1337
            <span className="font-medium text-navy-300">.games</span>
          </span>
        </Link>

        <a
          href="#games"
          className="hidden text-[13px] text-navy-200 transition hover:text-white md:inline-flex"
        >
          {t("nav.games")}
        </a>

        <Link
          href="/login"
          className="ml-auto text-[13px] font-medium text-navy-200 transition hover:text-white"
        >
          {t("intra.signIn")}
        </Link>
      </div>
    </header>
  );
}
