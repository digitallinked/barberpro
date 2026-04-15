export default function BranchLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-md bg-gray-800" />
        <div className="h-9 w-28 rounded-md bg-gray-800" />
      </div>

      {/* Stat card row skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-800/60 p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-gray-700" />
            <div className="h-7 w-16 rounded bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Content block skeleton */}
      <div className="rounded-xl bg-gray-800/60 p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-gray-700" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-gray-700/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
