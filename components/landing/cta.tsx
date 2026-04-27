import { IntraButton } from "./intra-button";
import { t } from "@/lib/i18n";

/** Closing call-to-action band right before the footer. */
export function LandingCTA() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1100px] px-6 pb-20">
        <div className="rounded-3xl border border-white/5 bg-navy-900 px-10 py-14 md:px-16 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[560px]">
              <div className="mb-3 font-mono text-[12px] text-navy-400">
                {t("cta.eyebrow")}
              </div>
              <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
                {t("cta.title1")}{" "}
                <span className="font-medium italic text-brand-lime">
                  {t("cta.title1Accent")}
                </span>
                {t("cta.title2")} {t("cta.title3")}
              </h2>
            </div>
            <IntraButton />
          </div>
        </div>
      </div>
    </section>
  );
}
