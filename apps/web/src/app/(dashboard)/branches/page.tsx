import { Clock, MapPin, Plus, Store } from "lucide-react";

export default function BranchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Branches</h2>
          <p className="mt-1 text-sm text-gray-400">Manage multi-branch operations and locations</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {/* Quick branch cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { name: "KL Sentral HQ", address: "Lot G-01, KL Sentral Station", staff: 4, status: "Open" },
          { name: "Bangsar Branch", address: "38 Jalan Telawi 3, Bangsar", staff: 3, status: "Open" },
          { name: "TTDI Branch", address: "12A Jalan Tun Mohd Fuad, TTDI", staff: 2, status: "Closed" }
        ].map((b) => (
          <div key={b.name} className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                <Store className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                b.status === "Open" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              }`}>{b.status}</span>
            </div>
            <h3 className="text-sm font-bold text-white">{b.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" /> {b.address}</p>
            <p className="mt-1 text-xs text-gray-500">{b.staff} staff members</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
          <MapPin className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Full Branch Management Coming Soon</h3>
        <p className="max-w-md text-center text-sm text-gray-400">
          Branch comparison, staff assignment, inter-branch transfers and detailed location analytics are being developed.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-400">
          <Clock className="h-3.5 w-3.5" /> In development
        </div>
      </div>
    </div>
  );
}
