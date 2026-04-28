type ChessClockProps = {
  /** Total milliseconds remaining for this side. Pass the live countdown value. */
  ms: number;
  /** Whether this side is on the move and should look "active". */
  active: boolean;
  /** Optional label (e.g. opponent's login or "You"). Hidden when omitted. */
  label?: string;
  /** Visual size. "lg" used in the match header, "sm" in the side panel. */
  size?: "sm" | "lg";
};

const LOW_TIME_MS = 10_000;

/**
 * Presentational clock chip. Pulses when the side is on the move and flashes
 * coral when the bank dips below 10 seconds. The countdown value is owned by
 * the parent so a single tick interval drives both clocks in lockstep.
 */
export function ChessClock({
  ms,
  active,
  label,
  size = "sm",
}: ChessClockProps) {
  const lowTime = ms <= LOW_TIME_MS;
  const digitClass =
    size === "lg" ? "text-[34px] tracking-tight" : "text-[20px]";

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 transition-all ${
        active
          ? lowTime
            ? "bg-brand-coral/15 text-white ring-brand-coral/50"
            : "bg-brand-lime/10 text-white ring-brand-lime/40"
          : "bg-white/[0.03] text-navy-200 ring-white/5"
      } ${active && lowTime ? "animate-pulse" : ""}`}
    >
      {label && (
        <span className="text-[11px] uppercase tracking-wider opacity-70">
          {label}
        </span>
      )}
      <span className={`font-bold tabular-nums ${digitClass}`}>
        {formatClock(ms)}
      </span>
    </div>
  );
}

/** Formats milliseconds as `mm:ss` for clocks above 10 seconds, `ss.t` below. */
function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) {
    const seconds = Math.floor(clamped / 1000);
    const tenths = Math.floor((clamped % 1000) / 100);
    return `${seconds}.${tenths}`;
  }
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
