import {
  ArrowUpRight,
  BarChart2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  CreditCard,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  TrendingDown,
  Wallet
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Today's Expenses", value: "RM 1,735.00", icon: CircleDollarSign, iconBg: "bg-red-500/10", iconColor: "text-red-400", trend: "+RM 250 vs yesterday", trendUp: false },
  { label: "Payroll Payable", value: "RM 8,450.00", icon: Wallet, iconBg: "bg-purple-500/10", iconColor: "text-purple-400", trend: "Next payout: 1st Nov", trendUp: true },
  { label: "Monthly Total", value: "RM 32,180.00", icon: BarChart2, iconBg: "bg-blue-500/10", iconColor: "text-blue-400", trend: "-5% vs last month", trendUp: true },
  { label: "Pending Approval", value: "RM 4,200.00", icon: Clock, iconBg: "bg-orange-500/10", iconColor: "text-orange-400", trend: "3 items pending", trendUp: false }
];

const EXPENSES = [
  { date: "28 Oct 2023", category: "Utilities", categoryColor: "bg-blue-500/10 text-blue-400", vendor: "TNB", branch: "KL Sentral HQ", amount: "- RM 450.00", payment: "Bank Transfer", status: "Approved", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { date: "27 Oct 2023", category: "Utilities", categoryColor: "bg-blue-500/10 text-blue-400", vendor: "Syabas", branch: "KL Sentral HQ", amount: "- RM 85.00", payment: "Bank Transfer", status: "Approved", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { date: "26 Oct 2023", category: "Supplies", categoryColor: "bg-purple-500/10 text-purple-400", vendor: "Mentega Co.", branch: "KL Sentral HQ", amount: "- RM 1,200.00", payment: "Cash", status: "Approved", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { date: "25 Oct 2023", category: "Maintenance", categoryColor: "bg-orange-500/10 text-orange-400", vendor: "Aircon Service KL", branch: "Bangsar Branch", amount: "- RM 350.00", payment: "Cash", status: "Pending", statusColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { date: "24 Oct 2023", category: "Marketing", categoryColor: "bg-pink-500/10 text-pink-400", vendor: "FB Ads", branch: "All Branches", amount: "- RM 500.00", payment: "Card", status: "Approved", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { date: "23 Oct 2023", category: "Rent", categoryColor: "bg-red-500/10 text-red-400", vendor: "Landlord KL", branch: "KL Sentral HQ", amount: "- RM 3,500.00", payment: "Bank Transfer", status: "Approved", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
];

const PAYMENT_BREAKDOWN = [
  { method: "Bank Transfer", pct: 52, color: "bg-blue-500" },
  { method: "Cash",          pct: 28, color: "bg-emerald-500" },
  { method: "Card",          pct: 15, color: "bg-purple-500" },
  { method: "E-Wallet",      pct: 5,  color: "bg-[#D4AF37]" }
];

const TOP_CATEGORIES = [
  { name: "Rent", amount: "RM 10,500", pct: 33 },
  { name: "Payroll", amount: "RM 8,450", pct: 26 },
  { name: "Supplies", amount: "RM 5,200", pct: 16 },
  { name: "Utilities", amount: "RM 4,100", pct: 13 },
  { name: "Marketing", amount: "RM 2,500", pct: 8 }
];

const RECENT = [
  { name: "TNB Bill (Electricity)", note: "Oct 2023", amount: "- RM 450.00" },
  { name: "Syabas Bill (Water)", note: "Oct 2023", amount: "- RM 85.00" },
  { name: "Restock: Pomade", note: "Supplier: Mentega Co.", amount: "- RM 1,200.00" }
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function MiniChart() {
  const bars = [45, 62, 38, 75, 55, 80, 50];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex h-24 items-end gap-2">
      {bars.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div style={{ height: `${(v / 100) * 70}px` }} className={`w-full rounded-t ${i === 5 ? "bg-red-400" : "bg-red-400/20"}`} />
          <span className="text-[9px] text-gray-600">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Expense Management</h2>
          <p className="mt-1 text-sm text-gray-400">Track and manage all business expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40"><Download className="h-4 w-4" /> Export</button>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"><Plus className="h-4 w-4" /> Add Expense</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{s.value}</h3>
              <p className={`mt-1 flex items-center gap-1 text-xs ${s.trendUp ? "text-emerald-400" : "text-red-400"}`}>
                {s.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {s.trend}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-bold text-white mb-3">Expense Trends</h3>
            <MiniChart />
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">All Expenses</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input type="text" placeholder="Search..." className="rounded-lg border border-white/10 bg-[#111] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 outline-none w-36" />
                </div>
                <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-2 py-1.5 text-xs text-gray-400"><ChevronDown className="h-3 w-3" /> Filter</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Vendor</th>
                    <th className="p-4 text-left">Branch</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Payment</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {EXPENSES.map((e, i) => (
                    <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="p-4 text-gray-300">{e.date}</td>
                      <td className="p-4"><span className={`rounded px-2 py-0.5 text-xs font-bold ${e.categoryColor}`}>{e.category}</span></td>
                      <td className="p-4 text-white font-medium">{e.vendor}</td>
                      <td className="p-4 text-gray-300">{e.branch}</td>
                      <td className="p-4 font-bold text-red-400">{e.amount}</td>
                      <td className="p-4 text-gray-300">{e.payment}</td>
                      <td className="p-4"><span className={`rounded border px-2 py-0.5 text-xs font-bold ${e.statusColor}`}>{e.status}</span></td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button type="button" className="rounded p-1 text-gray-500 hover:text-white"><Eye className="h-4 w-4" /></button>
                          <button type="button" className="rounded p-1 text-gray-500 hover:text-white"><Pencil className="h-4 w-4" /></button>
                          <button type="button" className="rounded p-1 text-gray-500 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
              <p className="text-xs text-gray-500">Showing 1-{EXPENSES.length} of {EXPENSES.length}</p>
              <div className="flex gap-1">
                <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400">Previous</button>
                <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400">Next</button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Payment Breakdown</h3>
            <div className="space-y-3">
              {PAYMENT_BREAKDOWN.map((p) => (
                <div key={p.method}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">{p.method}</span>
                    <span className="text-white font-medium">{p.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Recent Expenses</h3>
              <button type="button" className="text-xs font-medium text-[#D4AF37]">View All</button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {RECENT.map((r) => (
                <div key={r.name} className="flex items-center justify-between px-5 py-3">
                  <div><p className="text-sm font-medium text-white">{r.name}</p><p className="text-xs text-gray-500">{r.note}</p></div>
                  <p className="text-sm font-bold text-white">{r.amount}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Top Categories</h3>
            <div className="space-y-3">
              {TOP_CATEGORIES.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{c.amount}</p>
                    <p className="text-xs text-gray-500">{c.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
