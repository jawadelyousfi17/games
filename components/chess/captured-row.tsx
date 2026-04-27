type CapturedRowProps = {
  /** Pre-rendered Unicode glyphs (e.g. "♙", "♟"). */
  pieces: string[];
};

/**
 * Inline strip of captured pieces. Renders as small overlapping glyphs so a
 * heavy capture log doesn't push the board out of view.
 */
export function CapturedRow({ pieces }: CapturedRowProps) {
  if (pieces.length === 0) {
    return <span className="text-[12px] text-navy-500">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-0.5 leading-none">
      {pieces.map((p, i) => (
        <span key={i} className="text-[18px] text-white/85">
          {p}
        </span>
      ))}
    </div>
  );
}
