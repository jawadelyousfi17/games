import { ChessHero } from "./chess-hero";
import { IntraButton } from "./intra-button";
import { t } from "@/lib/i18n";

/**
 * Above-the-fold hero. Single column, single accent, no chart-junk:
 * chess art on top, headline + intra CTA below.
 */
export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-16">
        <div className="mb-8 flex items-center gap-3 text-[12px] text-navy-300">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 ring-1 ring-white/10">
            <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-brand-lime" />
            {t("hero.season")}
          </span>
          <span className="text-navy-500">/</span>
          <span>{t("hero.audience")}</span>
        </div>

        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.05fr]">
          <div>
            <h1 className="text-[clamp(44px,6vw,76px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-white">
              {t("hero.title1")}
              <br />
              <span className="font-medium italic text-navy-200">
                {t("hero.title2")}
              </span>{" "}
              <span className="text-brand-lime">{t("hero.title3")}</span>
            </h1>
            <p className="mt-6 max-w-[440px] text-[15px] leading-relaxed text-navy-200">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <IntraButton />
              <span className="text-[12px] text-navy-400">
                {t("hero.oauthHint")}
              </span>
            </div>
          </div>

          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl ring-1 ring-white/5">
            <ChessHero />
          </div>
        </div>
      </div>
    </section>
  );
}
