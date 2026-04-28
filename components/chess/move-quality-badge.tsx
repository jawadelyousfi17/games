import { QUALITY_META, type Quality } from "@/lib/chess/move-quality";

type MoveQualityBadgeProps = {
  quality: Quality;
  /** When true, render as a small dot only — used in the inline move list. */
  compact?: boolean;
};

/**
 * Small chip describing a move's quality (Best / Good / Inaccuracy / Mistake
 * / Blunder). Color and label come from the central QUALITY_META table.
 */
export function MoveQualityBadge({ quality, compact }: MoveQualityBadgeProps) {
  const meta = QUALITY_META[quality];

  if (compact) {
    return (
      <span
        title={meta.label}
        aria-label={meta.label}
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: meta.color }}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}
