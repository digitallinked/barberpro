export default function ShopLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[65px] border-b border-border/60 bg-background/95" />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          {/* Shop header skeleton */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 h-14 w-14 animate-pulse rounded-xl bg-muted" />
              <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
              <div className="mt-2 h-5 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="mt-3 flex gap-4">
                <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
            <div className="h-11 w-44 animate-pulse rounded-xl bg-muted" />
          </div>

          {/* Services skeleton */}
          <div className="mt-10">
            <div className="mb-4 h-7 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0">
                  <div>
                    <div className="h-5 w-40 animate-pulse rounded-lg bg-muted" />
                    <div className="mt-1.5 h-4 w-20 animate-pulse rounded-lg bg-muted" />
                  </div>
                  <div className="h-5 w-16 animate-pulse rounded-lg bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Barbers skeleton */}
          <div className="mt-10">
            <div className="mb-4 h-7 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-muted" />
                  <div className="mx-auto mt-3 h-5 w-24 animate-pulse rounded-lg bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
