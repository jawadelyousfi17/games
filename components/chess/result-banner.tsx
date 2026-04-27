import Link from "next/link";
import { Button } from "@/components/ui/button";

type ResultBannerProps = {
  /** Headline result line (e.g. "You won by checkmate"). */
  title: string;
  /** Smaller second line (e.g. "+8 rating"). Optional. */
  subtitle?: string;
  /** Tints the banner: lime = win, coral = loss, amber = draw. */
  tone: "win" | "loss" | "draw";
  /** Where the primary CTA navigates. Defaults to /games/chess. */
  href?: string;
  /** CTA label. */
  cta?: string;
};

const TONES: Record<ResultBannerProps["tone"], { ring: string; accent: string }> = {
  win: { ring: "ring-brand-lime/40", accent: "text-brand-lime" },
  loss: { ring: "ring-brand-coral/40", accent: "text-brand-coral" },
  draw: { ring: "ring-brand-amber/40", accent: "text-brand-amber" },
};

/**
 * Outcome card shown above the board when a game ends. Quiet styling — sits
 * inline rather than taking over the screen with a modal.
 */
export function ResultBanner({
  title,
  subtitle,
  tone,
  href = "/games/chess",
  cta = "Back to lobby",
}: ResultBannerProps) {
  const { ring, accent } = TONES[tone];
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-navy-850 px-5 py-4 ring-1 ${ring}`}
    >
      <div>
        <div className={`font-mono text-[11px] uppercase tracking-wider ${accent}`}>
          Result
        </div>
        <div className="mt-0.5 text-[18px] font-bold text-white">{title}</div>
        {subtitle && (
          <div className="font-mono text-[12px] text-navy-300">{subtitle}</div>
        )}
      </div>
      <Button asChild>
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
