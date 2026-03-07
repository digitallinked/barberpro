import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BookOpen,
  CalendarPlus,
  CircleDollarSign,
  CreditCard,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Timer,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    label: "Total Sales Today",
    value: "RM 1,245.00",
    sub: "Target: RM 2,000",
    icon: CircleDollarSign,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    trend: "+8% vs yesterday",
    trendUp: true
  },
  {
    label: "Customers Served",
    value: "18",
    valueSuffix: "/ 24",
    sub: null,
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    trend: "+3 vs yesterday",
    trendUp: true,
    avatarsCount: 15
  },
  {
    label: "Active Queue",
    value: "5",
    valueSuffix: "waiting",
    sub: null,
    icon: Timer,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    trend: null,
    trendUp: null,
    showQueueBtn: true
  },
  {
    label: "Payroll Payable",
    value: "RM 8,450",
    sub: "Includes commissions up to yesterday.",
    icon: CircleDollarSign,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    trend: null,
    trendUp: null
  }
];

const TRANSACTIONS = [
  { id: "#TRX-9821", customer: "Farid Kamil",  service: "Premium Cut + Shave", barber: "Sam",  barberInit: "S",  amount: "RM 65.00",  status: "Paid",       statusColor: "green"  },
  { id: "#TRX-9820", customer: "Jason Lim",    service: "Kids Cut",             barber: "Zack", barberInit: "Z",  amount: "RM 25.00",  status: "Paid (QR)",  statusColor: "green"  },
  { id: "#TRX-9819", customer: "Muthu Kumar",  service: "Hair Coloring",        barber: "Ali",  barberInit: "A",  amount: "RM 120.00", status: "Pending",    statusColor: "yellow" },
  { id: "#TRX-9818", customer: "Walk-in Guest",service: "Basic Cut",            barber: "Sam",  barberInit: "S",  amount: "RM 35.00",  status: "Paid",       statusColor: "green"  }
];

const QUICK_ACTIONS = [
  { label: "Add Walk-in",  icon: PlusCircle,  color: "text-[#D4AF37]" },
  { label: "Book Appt",    icon: CalendarPlus,color: "text-blue-400" },
  { label: "Checkout",     icon: CreditCard,  color: "text-emerald-400" },
  { label: "Add Expense",  icon: Receipt,     color: "text-red-400" }
];

const TOP_BARBERS = [
  { name: "Sam",  init: "S",  revenue: "RM 450", customers: 8,  rank: 1 },
  { name: "Zack", init: "Z",  revenue: "RM 320", customers: 5,  rank: 2 },
  { name: "Ali",  init: "A",  revenue: "RM 280", customers: 6,  rank: 3 }
];

const LOW_STOCK = [
  { name: "Pomade Matte Clay",  qty: "2 left",  severity: "red"    },
  { name: "Shaving Foam XL",    qty: "1 left",  severity: "red"    },
  { name: "Face Towels (White)",qty: "5 left",  severity: "yellow" }
];

const BRANCHES = [
  { name: "KL Sentral HQ",  note: "Best performing", revenue: "RM 45,200", trend: "+12% vs last mth", up: true  },
  { name: "Bangsar Branch", note: "Target: RM 30k",  revenue: "RM 28,450", trend: "+5% vs last mth",  up: true  },
  { name: "TTDI Branch",    note: "Needs attention",  revenue: "RM 15,100", trend: "-8% vs last mth",  up: false }
];

const EXPENSES = [
  { name: "TNB Bill (Electricity)", note: "Oct 2023",             amount: "- RM 450.00"   },
  { name: "Syabas Bill (Water)",    note: "Oct 2023",             amount: "- RM 85.00"    },
  { name: "Restock: Pomade",        note: "Supplier: Mentega Co.",amount: "- RM 1,200.00" }
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>
  );
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  const cls = color === "green"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-bold ${cls}`}>{status}</span>
  );
}

// ─── Mini bar chart (SVG placeholder that looks like a real chart) ────────────

function MiniChart() {
  const bars = [60, 82, 55, 90, 78, 95, 70];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxH = 80;
  return (
    <div className="flex h-28 items-end gap-2">
      {bars.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            style={{ height: `${(v / 100) * maxH}px` }}
            className={`w-full rounded-t transition-all ${i === 5 ? "bg-[#D4AF37]" : "bg-[#D4AF37]/20"}`}
          />
          <span className="text-[9px] text-gray-600">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Good morning, Ahmad</h2>
          <p className="mt-1 text-sm text-gray-400">
            Here&apos;s what&apos;s happening at{" "}
            <span className="font-medium text-[#D4AF37]">KL Sentral HQ</span> today.
          </p>
        </div>
        {/* Period toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-[#1a1a1a] p-1">
          {["Today", "Week", "Month"].map((p, i) => (
            <button
              key={p}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                i === 0 ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
                <span className={`rounded-lg p-2 ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white">{card.value}</h3>
                {card.valueSuffix && (
                  <span className="text-sm font-normal text-gray-500">{card.valueSuffix}</span>
                )}
              </div>
              {card.sub && <p className="mt-1.5 text-xs text-gray-500">{card.sub}</p>}
              {card.trend && (
                <p className={`mt-1.5 flex items-center gap-1 text-xs ${card.trendUp ? "text-emerald-400" : "text-red-400"}`}>
                  {card.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.trend}
                </p>
              )}
              {card.showQueueBtn && (
                <button
                  type="button"
                  className="mt-3 w-full rounded border border-white/10 py-1.5 text-xs text-white transition hover:bg-white/5"
                >
                  View Queue Board
                </button>
              )}
              {card.avatarsCount && (
                <div className="mt-3 flex items-center">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className={`-ml-2 first:ml-0 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#2a2a2a] text-[10px] font-medium text-white`}
                    >
                      {["S","Z","A"][i]}
                    </span>
                  ))}
                  <span className="-ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#2a2a2a] text-[10px] font-medium text-white">
                    +15
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Sales & Revenue chart */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Sales &amp; Revenue</h3>
                <p className="mt-0.5 text-sm text-gray-500">Daily revenue comparison with last week</p>
              </div>
              <BarChart2 className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <MiniChart />
            <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]" />
                This week
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]/20" />
                Last week
              </span>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Recent Transactions</h3>
              <button type="button" className="text-sm font-medium text-[#D4AF37] transition hover:text-[#D4AF37]/80">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Customer</th>
                    <th className="p-4 text-left">Service</th>
                    <th className="p-4 text-left">Barber</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((t) => (
                    <tr key={t.id} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                      <td className="p-4 font-mono text-gray-500">{t.id}</td>
                      <td className="p-4 font-medium text-white">{t.customer}</td>
                      <td className="p-4 text-gray-300">{t.service}</td>
                      <td className="p-4 text-gray-300">
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-medium text-white">
                            {t.barberInit}
                          </span>
                          {t.barber}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white">{t.amount}</td>
                      <td className="p-4">
                        <StatusBadge status={t.status} color={t.statusColor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-5">
            <h3 className="mb-4 font-bold text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-white/5 bg-[#111111] p-4 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/30 hover:bg-[#2a2a2a]"
                  >
                    <Icon className={`h-5 w-5 ${a.color}`} />
                    {a.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Top Barbers */}
          <Card className="p-5">
            <h3 className="mb-4 font-bold text-white">Top Barbers Today</h3>
            <div className="space-y-3">
              {TOP_BARBERS.map((b) => (
                <div key={b.name} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#2a2a2a] text-sm font-bold text-white">
                      {b.init}
                    </div>
                    {b.rank === 1 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-bold text-black">
                        1
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{b.name}</p>
                    <p className="text-[10px] text-gray-500">{b.customers} customers served</p>
                  </div>
                  <span className={`text-sm font-bold ${b.rank === 1 ? "text-[#D4AF37]" : b.rank === 2 ? "text-gray-300" : "text-gray-400"}`}>
                    {b.revenue}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Low Stock Alert */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-red-400">Low Stock Alert</h3>
            </div>
            <ul className="space-y-2">
              {LOW_STOCK.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between border-b border-red-500/10 pb-2 text-sm last:border-0"
                >
                  <span className="text-gray-300">{item.name}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      item.severity === "red"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {item.qty}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-1 text-xs font-medium text-red-400 transition hover:text-red-300"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Order Stock
            </button>
          </Card>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch Performance */}
        <Card>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h3 className="font-bold text-white">Branch Performance</h3>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </div>
          <div className="divide-y divide-white/[0.04]">
            {BRANCHES.map((b) => (
              <div key={b.name} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-white">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.note}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{b.revenue}</p>
                  <p className={`flex items-center justify-end gap-1 text-xs ${b.up ? "text-emerald-400" : "text-red-400"}`}>
                    {b.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {b.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h3 className="font-bold text-white">Recent Expenses</h3>
            <button
              type="button"
              className="rounded-md bg-[#2a2a2a] px-3 py-1 text-xs text-white transition hover:bg-[#333]"
            >
              Add New
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {EXPENSES.map((e) => (
              <div key={e.name} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{e.name}</p>
                  <p className="text-xs text-gray-500">{e.note}</p>
                </div>
                <p className="text-sm font-bold text-white">{e.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
