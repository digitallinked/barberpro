export default function DashboardPageLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-800/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-gray-700" />
              <div className="h-5 w-5 rounded bg-gray-700" />
            </div>
            <div className="h-8 w-20 rounded bg-gray-700" />
            <div className="h-3 w-28 rounded bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl bg-gray-800/60 p-6 space-y-4">
        <div className="h-4 w-36 rounded bg-gray-700" />
        <div className="h-48 w-full rounded bg-gray-700/50" />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-gray-800/60 p-6 space-y-4">
          <div className="h-4 w-40 rounded bg-gray-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-gray-700/50" />
          ))}
        </div>
        <div className="rounded-xl bg-gray-800/60 p-6 space-y-4">
          <div className="h-4 w-32 rounded bg-gray-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-gray-700/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
