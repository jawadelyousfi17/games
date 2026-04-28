import type { ReviewStatus } from "./use-game-review";

type ReviewStatusProps = {
  status: ReviewStatus;
  analyzed: number;
  total: number;
};

const STATUS_META: Record<
  ReviewStatus,
  { label: (a: number, t: number) => string; color: string }
> = {
  loading: {
    label: () => "Engine: loading…",
    color: "#9a9994",
  },
  ready: {
    label: () => "Engine: ready",
    color: "#81b64c",
  },
  analyzing: {
    label: (a, t) => `Reviewing ${a}/${t}`,
    color: "#e5b04a",
  },
  idle: {
    label: () => "Review complete",
    color: "#81b64c",
  },
  error: {
    label: () => "Engine unavailable",
    color: "#d65a5a",
  },
};

/**
 * Tiny status pill summarising the live review state. Goes next to the
 * "Moves" sub-tab so users know whether the engine is loading, working
 * through positions, or stalled.
 */
export function ReviewStatus({ status, analyzed, total }: ReviewStatusProps) {
  const meta = STATUS_META[status];
  return (
    <div className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 ring-1 ring-white/5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color }}
      />
      <span className="text-[11px] font-semibold text-white">
        {meta.label(analyzed, total)}
      </span>
    </div>
  );
}
