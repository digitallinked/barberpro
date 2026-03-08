import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Pencil,
  Star,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";

// ─── Data ──────────────────────────────────────────────────────────────────────

const PROFILE = {
  name: "Muhammad Zack",
  init: "MZ",
  role: "Barber",
  branch: "KL Sentral HQ",
  status: "Available",
  joined: "Jan 2022",
  phone: "+60 19-876 5432",
  email: "zack@barberpro.my"
};

const STAT_CARDS = [
  { label: "Total Customers", value: "142", icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { label: "Total Revenue", value: "RM 8,240", icon: CircleDollarSign, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { label: "Commissions", value: "RM 1,450", icon: TrendingUp, iconBg: "bg-purple-500/10", iconColor: "text-purple-400" },
  { label: "Product Sales", value: "RM 2,890", icon: CircleDollarSign, iconBg: "bg-[#D4AF37]/10", iconColor: "text-[#D4AF37]" },
  { label: "Avg Rating", value: "4.9", icon: Star, iconBg: "bg-orange-500/10", iconColor: "text-orange-400" }
];

const RECENT_SERVICES = [
  { date: "28 Oct, 14:30", customer: "Ahmad Fauzi",  service: "Premium Cut + Shave", duration: "45 min", amount: "RM 65.00",  rating: 5 },
  { date: "28 Oct, 13:00", customer: "Jason Lee",    service: "Hair Coloring",        duration: "90 min", amount: "RM 120.00", rating: 5 },
  { date: "28 Oct, 11:30", customer: "Walk-in Guest",service: "Basic Cut",            duration: "30 min", amount: "RM 35.00",  rating: 4 },
  { date: "27 Oct, 16:00", customer: "Hafiz Rahman", service: "Beard Trim",           duration: "15 min", amount: "RM 20.00",  rating: 5 },
  { date: "27 Oct, 14:00", customer: "Tan Wei Liang",service: "Kids Cut",             duration: "20 min", amount: "RM 25.00",  rating: 5 }
];

const CUSTOMER_STATS = [
  { label: "Repeat customers", value: "78%" },
  { label: "New customers", value: "22%" },
  { label: "Avg ticket", value: "RM 58" },
  { label: "Customers/day", value: "7.2" }
];

const ATTENDANCE = [
  { label: "Days worked", value: "24 / 26" },
  { label: "Late arrivals", value: "1" },
  { label: "Sick leave", value: "1" },
  { label: "On time %", value: "96%" }
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function MiniChart() {
  const bars = [60, 75, 55, 85, 70, 90, 65];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex h-20 items-end gap-2">
      {bars.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div style={{ height: `${(v / 100) * 60}px` }} className={`w-full rounded-t ${i === 5 ? "bg-[#D4AF37]" : "bg-[#D4AF37]/20"}`} />
          <span className="text-[9px] text-gray-600">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function StaffProfilePage() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/staff" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Staff
      </Link>

      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/20 text-2xl font-bold text-[#D4AF37]">
              {PROFILE.init}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{PROFILE.name}</h1>
              <p className="text-gray-400">{PROFILE.role} • {PROFILE.branch}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarCheck2 className="h-3 w-3" /> Joined {PROFILE.joined}</span>
                <span>{PROFILE.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              {PROFILE.status}
            </span>
            <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 hover:text-white">
              <Pencil className="h-4 w-4" /> Edit
            </button>
          </div>
        </div>
      </Card>

      {/* 5 stat cards */}
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 text-center">
              <span className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
                <Icon className={`h-5 w-5 ${s.iconColor}`} />
              </span>
              <h3 className="text-3xl font-bold text-white">{s.value}</h3>
              <p className="mt-1 text-xs text-gray-500">{s.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Performance */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Performance Overview</h3>
              <div className="flex gap-1">
                <button type="button" className="rounded-md bg-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-white">Week</button>
                <button type="button" className="rounded-md bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111]">Month</button>
              </div>
            </div>
            <MiniChart />
          </Card>

          {/* Recent services table */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Recent Services Completed</h3>
              <button type="button" className="text-sm font-medium text-[#D4AF37]">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-4 text-left">Date &amp; Time</th>
                    <th className="p-4 text-left">Customer</th>
                    <th className="p-4 text-left">Service</th>
                    <th className="p-4 text-left">Duration</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_SERVICES.map((s, i) => (
                    <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="p-4 text-gray-400">{s.date}</td>
                      <td className="p-4 font-medium text-white">{s.customer}</td>
                      <td className="p-4 text-gray-300">{s.service}</td>
                      <td className="p-4 text-gray-300">{s.duration}</td>
                      <td className="p-4 font-bold text-white">{s.amount}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-0.5 text-[#D4AF37]">
                          {[...Array(s.rating)].map((_, j) => <Star key={j} className="h-3 w-3 fill-current" />)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Customer stats */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Customer Stats</h3>
            <div className="space-y-3">
              {CUSTOMER_STATS.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{c.label}</span>
                  <span className="font-bold text-white">{c.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Attendance */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Attendance Summary</h3>
            <div className="space-y-3">
              {ATTENDANCE.map((a) => (
                <div key={a.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{a.label}</span>
                  <span className="font-bold text-white">{a.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payroll scheme */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-3">Payroll Scheme</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Base salary</span><span className="text-white">RM 2,200</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Service commission</span><span className="text-emerald-400">15%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Product commission</span><span className="text-blue-400">10%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">EPF deduction</span><span className="text-red-400">11%</span></div>
            </div>
          </Card>

          {/* Internal notes */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-3">Internal Notes</h3>
            <div className="space-y-2">
              <div className="rounded-lg bg-[#111] p-3 text-xs text-gray-400">
                <div className="flex items-center gap-1 mb-1"><FileText className="h-3 w-3 text-gray-600" /> <span className="text-gray-500">Oct 15, 2023</span></div>
                Zack has been performing well. Consider promotion to Senior Barber next quarter.
              </div>
              <div className="rounded-lg bg-[#111] p-3 text-xs text-gray-400">
                <div className="flex items-center gap-1 mb-1"><FileText className="h-3 w-3 text-gray-600" /> <span className="text-gray-500">Sep 28, 2023</span></div>
                Completed advanced hair coloring certification course.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
