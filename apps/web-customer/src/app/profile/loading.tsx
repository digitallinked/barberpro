export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[65px] border-b border-border/60 bg-background/95" />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div>
            <div className="h-8 w-36 animate-pulse rounded-lg bg-muted" />
            <div className="mt-2 h-5 w-48 animate-pulse rounded-lg bg-muted" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`rounded-xl border border-border bg-card p-4 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-muted" />
                <div className="mt-1 h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>

          {/* Plus card skeleton */}
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />

          {/* Loyalty skeleton */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-6 w-36 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
            <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-muted" />
          </div>

          {/* Appointments skeleton */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-6 w-44 animate-pulse rounded-lg bg-muted" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border py-4 last:border-0">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-5 w-3/4 animate-pulse rounded-lg bg-muted" />
                  <div className="mt-1 h-4 w-1/2 animate-pulse rounded-lg bg-muted" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
