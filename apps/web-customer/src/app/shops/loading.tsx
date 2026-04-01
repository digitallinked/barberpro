export default function ShopsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar placeholder */}
      <div className="h-[65px] border-b border-border/60 bg-background/95" />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Header skeleton */}
          <div className="mb-10">
            <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
            <div className="mt-2 h-5 w-40 animate-pulse rounded-lg bg-muted" />
          </div>

          {/* Search skeleton */}
          <div className="mb-8 h-11 w-full animate-pulse rounded-xl bg-muted sm:max-w-sm" />

          {/* Grid skeleton */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 h-11 w-11 animate-pulse rounded-lg bg-muted" />
                <div className="h-6 w-3/4 animate-pulse rounded-lg bg-muted" />
                <div className="mt-2 h-4 w-full animate-pulse rounded-lg bg-muted" />
                <div className="mt-1 h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
                <div className="mt-4 h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
