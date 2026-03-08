import {
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Customers", value: "1,247", icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-400", trend: "+12% this month", trendUp: true },
  { label: "New This Month", value: "89", icon: UserPlus, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", trend: "+23% vs last", trendUp: true },
  { label: "Returning", value: "156", icon: TrendingUp, iconBg: "bg-purple-500/10", iconColor: "text-purple-400", trend: "62% retention", trendUp: true },
  { label: "VIP Members", value: "12", icon: Star, iconBg: "bg-[#D4AF37]/10", iconColor: "text-[#D4AF37]", trend: "Top spenders", trendUp: true }
];

const CUSTOMERS = [
  { name: "Ahmad Fauzi", init: "AF", phone: "+60 12-345 6789", barber: "Sam", visits: "47 visits", lastVisit: "2 days ago", points: 1240, status: "VIP", statusColor: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  { name: "Tan Wei Liang", init: "TW", phone: "+60 19-876 5432", barber: "Zack", visits: "32 visits", lastVisit: "5 days ago", points: 890, status: "Regular", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { name: "Kumar s/o Rajan", init: "KR", phone: "+60 16-234 5678", barber: "Ali", visits: "28 visits", lastVisit: "1 week ago", points: 720, status: "Regular", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { name: "Jason Lee", init: "JL", phone: "+60 17-654 3210", barber: "Sam", visits: "19 visits", lastVisit: "3 weeks ago", points: 450, status: "Inactive", statusColor: "bg-red-500/10 text-red-400 border-red-500/20" },
  { name: "Hafiz Rahman", init: "HR", phone: "+60 13-456 7890", barber: "Ali", visits: "52 visits", lastVisit: "Yesterday", points: 1580, status: "VIP", statusColor: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  { name: "David Chong", init: "DC", phone: "+60 11-222 3344", barber: "Zack", visits: "15 visits", lastVisit: "2 weeks ago", points: 380, status: "Regular", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Customer Management</h2>
          <p className="mt-1 text-sm text-gray-400">View and manage your customer database</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{s.value}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" /> {s.trend}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Search & filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search customer, phone..." className="w-full rounded-lg border border-white/10 bg-[#111] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" />
          </div>
          <div className="flex gap-2">
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-gray-400 transition hover:text-white">
              Status <ChevronDown className="h-3 w-3" />
            </button>
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-gray-400 transition hover:text-white">
              Barber <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </Card>

      {/* Customer table */}
      <Card>
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="font-bold text-white">Customer Database</h3>
          <p className="text-sm text-gray-500">{CUSTOMERS.length} customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="p-4 text-left"><input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" /></th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Preferred Barber</th>
                <th className="p-4 text-left">Total Visits</th>
                <th className="p-4 text-left">Last Visit</th>
                <th className="p-4 text-left">Loyalty Points</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {CUSTOMERS.map((c) => (
                <tr key={c.name} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                  <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-bold text-white">{c.init}</div>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{c.phone}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a2a2a] text-[10px] font-bold text-white">{c.barber[0]}</span>
                      <span className="text-gray-300">{c.barber}</span>
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">{c.visits}</td>
                  <td className="p-4 text-gray-300">{c.lastVisit}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-[#D4AF37] font-medium">
                      <Star className="h-3 w-3" /> {c.points}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded border px-2 py-0.5 text-xs font-bold ${c.statusColor}`}>{c.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button type="button" className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-white"><Eye className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
          <p className="text-xs text-gray-500">Showing 1-{CUSTOMERS.length} of {CUSTOMERS.length}</p>
          <div className="flex gap-1">
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 transition hover:text-white">Previous</button>
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 transition hover:text-white">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
