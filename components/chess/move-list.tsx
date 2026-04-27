type MoveListProps = {
  /** Move history in SAN notation, ply-ordered (white, black, white, black, …). */
  history: string[];
};

/**
 * chess.com-style move list: numbered rows, alternating background, white SAN
 * on the left and black SAN on the right.
 */
export function MoveList({ history }: MoveListProps) {
  const rows: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: i / 2 + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-[13px] font-medium text-navy-400">
        Game starts with white&apos;s move.
      </div>
    );
  }

  return (
    <ol>
      {rows.map((r, i) => (
        <li
          key={r.num}
          className={`grid grid-cols-[2.5rem_1fr_1fr] gap-3 px-3 py-2 text-[14px] ${
            i % 2 === 0 ? "bg-white/[0.03]" : ""
          }`}
        >
          <span className="font-mono font-semibold text-navy-400">{r.num}.</span>
          <span className="font-semibold text-white">{r.white}</span>
          <span className="font-semibold text-navy-100">{r.black ?? ""}</span>
        </li>
      ))}
    </ol>
  );
}
