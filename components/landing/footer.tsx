import { t } from "@/lib/i18n";

const LINKS = [
  { key: "footer.links.github", href: "#" },
  { key: "footer.links.discord", href: "#" },
  { key: "footer.links.report", href: "#" },
];

/** Compact landing footer: brand mark + a few utility links. */
export function LandingFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-4 px-6 py-8 text-[12px] text-navy-300 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-lime text-[10px] font-bold text-navy-950">
            42
          </div>
          <span>{t("footer.tagline")}</span>
        </div>
        <div className="flex items-center gap-6">
          {LINKS.map((l) => (
            <a
              key={l.key}
              href={l.href}
              className="transition hover:text-white"
            >
              {t(l.key)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
