import { BarChart3, Clock, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports &amp; Analytics</h2>
          <p className="mt-1 text-sm text-gray-400">Business insights, revenue analytics and performance reports</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40">
          <Download className="h-4 w-4" /> Export Reports
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-24">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
          <BarChart3 className="h-8 w-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Reports Coming Soon</h3>
        <p className="max-w-md text-center text-sm text-gray-400">
          Revenue analytics, staff performance reports, customer trends and branch comparisons are being built. Full reporting dashboard coming soon.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-400">
          <Clock className="h-3.5 w-3.5" /> In development
        </div>
      </div>
    </div>
  );
}
