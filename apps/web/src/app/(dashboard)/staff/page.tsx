import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Users
} from "lucide-react";
import Link from "next/link";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STAFF = [
  { id: "sam",   name: "Muhammad Sam",   init: "MS", role: "Senior Barber", customers: 8,  revenue: "RM 450",  rating: 4.9, status: "available", branch: "KL Sentral HQ" },
  { id: "zack",  name: "Muhammad Zack",  init: "MZ", role: "Barber",        customers: 5,  revenue: "RM 320",  rating: 4.8, status: "busy",      branch: "KL Sentral HQ" },
  { id: "ali",   name: "Ali Hassan",     init: "AH", role: "Barber",        customers: 6,  revenue: "RM 280",  rating: 4.7, status: "available", branch: "KL Sentral HQ" },
  { id: "faiz",  name: "Faiz Abdullah",  init: "FA", role: "Junior Barber", customers: 4,  revenue: "RM 180",  rating: 4.5, status: "busy",      branch: "KL Sentral HQ" },
  { id: "rina",  name: "Rina Mohd",      init: "RM", role: "Barber",        customers: 0,  revenue: "RM 0",    rating: 4.6, status: "break",     branch: "KL Sentral HQ" },
  { id: "david", name: "David Chong",    init: "DC", role: "Barber",        customers: 4,  revenue: "RM 180",  rating: 4.4, status: "available", branch: "Bangsar Branch" }
];

const statusMap: Record<string, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  busy:      { label: "Serving",   cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  break:     { label: "On Break",  cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" }
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Management</h2>
          <p className="mt-1 text-sm text-gray-400">View and manage your barber team</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search staff..." className="rounded-lg border border-white/10 bg-[#1a1a1a] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none w-52" />
          </div>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <Card className="p-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-400">Total: <span className="font-bold text-white">{STAFF.length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-gray-400">Available: <span className="font-bold text-white">{STAFF.filter(s => s.status === "available").length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-sm text-gray-400">Serving: <span className="font-bold text-white">{STAFF.filter(s => s.status === "busy").length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-sm text-gray-400">Break: <span className="font-bold text-white">{STAFF.filter(s => s.status === "break").length}</span></span>
        </div>
      </Card>

      {/* Staff grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {STAFF.map((s) => {
          const st = statusMap[s.status];
          return (
            <Card key={s.id} className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#2a2a2a] text-lg font-bold text-white">
                    {s.init}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{s.name}</h3>
                    <p className="text-xs text-gray-400">{s.role}</p>
                    <p className="text-[10px] text-gray-500">{s.branch}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
                  {st.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-lg bg-[#111] p-3 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{s.customers}</p>
                  <p className="text-[10px] text-gray-500">Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{s.revenue}</p>
                  <p className="text-[10px] text-gray-500">Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#D4AF37] flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3" /> {s.rating}
                  </p>
                  <p className="text-[10px] text-gray-500">Rating</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/staff/${s.id}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 py-2 text-xs font-medium text-white hover:bg-white/5">
                  <Eye className="h-3.5 w-3.5" /> View Profile
                </Link>
                <button type="button" className="rounded-lg border border-white/10 p-2 text-gray-500 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" className="rounded-lg border border-white/10 p-2 text-gray-500 hover:text-white"><MoreHorizontal className="h-3.5 w-3.5" /></button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
