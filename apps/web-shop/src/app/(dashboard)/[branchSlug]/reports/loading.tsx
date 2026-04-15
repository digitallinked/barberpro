export default function ReportsLoading() {
  const tabs = ["Revenue", "Transactions", "Staff", "Attendance", "Customers", "Inventory", "Expenses", "P&L", "Annual Tax"];

  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-md bg-gray-800" />
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-md bg-gray-800" />
          <div className="h-9 w-24 rounded-md bg-gray-800" />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-800 pb-0">
        {tabs.map((tab) => (
          <div key={tab} className="h-9 w-24 flex-shrink-0 rounded-t-md bg-gray-800/60" />
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-xl bg-gray-800/60 p-6 space-y-4">
        <div className="h-4 w-36 rounded bg-gray-700" />
        <div className="h-56 w-full rounded bg-gray-700/50" />
      </div>

      {/* Table placeholder */}
      <div className="rounded-xl bg-gray-800/60 p-4 space-y-2">
        <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-gray-700" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-8 rounded bg-gray-700/50" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
