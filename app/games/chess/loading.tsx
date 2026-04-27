/** Loading skeleton for /games/chess lobby. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-navy-950 text-navy-50">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="mb-10 h-10 w-32 animate-pulse rounded bg-white/5" />
        <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
