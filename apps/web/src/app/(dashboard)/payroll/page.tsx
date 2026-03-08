import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  Minus,
  TrendingUp
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Gross", value: "RM 28,450", icon: CircleDollarSign, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { label: "Total Commissions", value: "RM 12,680", icon: TrendingUp, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { label: "Bonuses", value: "RM 2,400", icon: ArrowUpRight, iconBg: "bg-[#D4AF37]/10", iconColor: "text-[#D4AF37]" },
  { label: "Deductions", value: "RM 3,120", icon: Minus, iconBg: "bg-red-500/10", iconColor: "text-red-400" }
];

const PAYROLL_ROWS = [
  { name: "Sam", init: "S", base: "RM 2,500", serviceComm: "RM 1,850", productComm: "RM 420", bonus: "RM 500", deductions: "RM 250", net: "RM 5,020", status: "Paid" },
  { name: "Zack", init: "Z", base: "RM 2,200", serviceComm: "RM 1,450", productComm: "RM 280", bonus: "RM 300", deductions: "RM 180", net: "RM 4,050", status: "Paid" },
  { name: "Ali", init: "A", base: "RM 2,200", serviceComm: "RM 1,380", productComm: "RM 350", bonus: "RM 200", deductions: "RM 150", net: "RM 3,980", status: "Paid" },
  { name: "Faiz", init: "F", base: "RM 1,800", serviceComm: "RM 980", productComm: "RM 150", bonus: "RM 0", deductions: "RM 120", net: "RM 2,810", status: "Pending" },
  { name: "Rina", init: "R", base: "RM 2,000", serviceComm: "RM 1,200", productComm: "RM 200", bonus: "RM 300", deductions: "RM 200", net: "RM 3,500", status: "Paid" },
  { name: "David", init: "D", base: "RM 1,800", serviceComm: "RM 920", productComm: "RM 100", bonus: "RM 0", deductions: "RM 100", net: "RM 2,720", status: "Pending" }
];

const TOP_EARNERS = [
  { name: "Sam", init: "S", amount: "RM 5,020", rank: 1 },
  { name: "Zack", init: "Z", amount: "RM 4,050", rank: 2 },
  { name: "Ali", init: "A", amount: "RM 3,980", rank: 3 }
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function MiniChart() {
  const bars = [65, 72, 58, 80, 75, 85];
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  return (
    <div className="flex h-24 items-end gap-3">
      {bars.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div style={{ height: `${(v / 100) * 70}px` }} className={`w-full rounded-t ${i === bars.length - 1 ? "bg-[#D4AF37]" : "bg-[#D4AF37]/20"}`} />
          <span className="text-[9px] text-gray-600">{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function PayrollPage() {
  const netTotal = "RM 25,330";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Payroll &amp; Commissions</h2>
          <p className="mt-1 text-sm text-gray-400">Manage staff salaries, commissions and payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40"><Download className="h-4 w-4" /> Export</button>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"><Banknote className="h-4 w-4" /> Process Payroll</button>
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
            </Card>
          );
        })}
      </div>

      {/* Net payout banner */}
      <Card className="border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/10 to-transparent p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Net Payout This Month</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{netTotal}</h3>
          </div>
          <CircleDollarSign className="h-8 w-8 text-[#D4AF37]/40" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Payroll table */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Payroll Breakdown</h3>
              <span className="text-xs text-gray-500">October 2023</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-4 text-left">Barber</th>
                    <th className="p-4 text-right">Base Salary</th>
                    <th className="p-4 text-right">Service Comm.</th>
                    <th className="p-4 text-right">Product Comm.</th>
                    <th className="p-4 text-right">Bonus</th>
                    <th className="p-4 text-right">Deductions</th>
                    <th className="p-4 text-right">Net Payout</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYROLL_ROWS.map((r) => (
                    <tr key={r.name} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-bold text-white">{r.init}</div>
                          <span className="font-medium text-white">{r.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-gray-300">{r.base}</td>
                      <td className="p-4 text-right text-emerald-400">{r.serviceComm}</td>
                      <td className="p-4 text-right text-blue-400">{r.productComm}</td>
                      <td className="p-4 text-right text-[#D4AF37]">{r.bonus}</td>
                      <td className="p-4 text-right text-red-400">{r.deductions}</td>
                      <td className="p-4 text-right font-bold text-white">{r.net}</td>
                      <td className="p-4">
                        <span className={`rounded border px-2 py-0.5 text-xs font-bold ${
                          r.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Monthly trend */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Monthly Payroll Trend</h3>
            <MiniChart />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Top earners */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Top Earners This Month</h3>
            <div className="space-y-3">
              {TOP_EARNERS.map((e) => (
                <div key={e.name} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#2a2a2a] text-sm font-bold text-white">{e.init}</div>
                    {e.rank === 1 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-bold text-black">1</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{e.name}</p>
                  </div>
                  <span className={`text-sm font-bold ${e.rank === 1 ? "text-[#D4AF37]" : "text-gray-300"}`}>{e.amount}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payroll summary */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Payroll Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Total Base Salaries</span><span className="text-white">RM 12,500</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Commissions</span><span className="text-emerald-400">RM 12,680</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Bonuses</span><span className="text-[#D4AF37]">RM 2,400</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Deductions</span><span className="text-red-400">- RM 3,120</span></div>
              <div className="flex justify-between border-t border-white/5 pt-2 font-bold"><span className="text-white">Net Payout</span><span className="text-[#D4AF37]">{netTotal}</span></div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-3">Payroll Notes</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2"><FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-600" /> Commission rates: 15% for services, 10% for products</li>
              <li className="flex items-start gap-2"><FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-600" /> Sam receives senior barber bonus (RM 500)</li>
              <li className="flex items-start gap-2"><FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-600" /> SOCSO &amp; EPF included in deductions</li>
            </ul>
          </Card>

          {/* Payment schedule */}
          <Card className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-3">Payment Schedule</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-400">Next payout:</span>
                <span className="font-medium text-white">1st November 2023</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-400">Payout method:</span>
                <span className="font-medium text-white">Bank Transfer</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-gray-400">4 of 6 staff paid</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
