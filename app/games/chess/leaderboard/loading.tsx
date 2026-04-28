/** Loading skeleton for the leaderboard. */
export default function Loading() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-8 h-12 w-48 animate-pulse rounded bg-white/5" />
        <ul className="flex flex-col gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <li
              key={i}
              className="h-16 animate-pulse rounded-md bg-white/5"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
