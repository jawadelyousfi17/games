/** Loading skeleton for an online chess game. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-navy-950 text-navy-50">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-white/5" />
            <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
          </div>
          <div className="min-h-[420px] animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
