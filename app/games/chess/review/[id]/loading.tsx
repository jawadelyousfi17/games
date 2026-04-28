/** Loading skeleton for the dedicated game review page. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-navy-950">
      <div className="flex h-screen p-6">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="h-[480px] w-[480px] animate-pulse rounded bg-white/5" />
        </div>
        <div className="hidden h-screen w-[560px] animate-pulse bg-white/5 xl:block" />
      </div>
    </div>
  );
}
