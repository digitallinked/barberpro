"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  CalendarPlus,
  CircleDollarSign,
  CreditCard,
  PlusCircle,
  ShoppingCart,
  Timer,
  Users
} from "lucide-react";
import Link from "next/link";

import {
  useDashboardStats,
  useDailyRevenue,
  useTransactions,
  useStaffMembers,
  useInventoryItems,
  useBranches,
  useExpenses,
  useQueueStats
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { useT } from "@/lib/i18n/language-context";
import type { Period } from "@/services/transactions";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>
  );
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  const cls =
    color === "green"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-bold ${cls}`}>{status}</span>
  );
}

function formatAmount(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function MiniChart({ bars }: { bars: { label: string; revenue: number }[] }) {
  const maxRevenue = Math.max(...bars.map((b) => b.revenue), 1);
  const maxH = 80;
  const today = new Date();
  const myNow = new Date(today.getTime() + 8 * 60 * 60 * 1000);
  const dayLabels = ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"];
  const myDayOfWeek = myNow.getUTCDay();
  const todayLabel = dayLabels[myDayOfWeek === 0 ? 6 : myDayOfWeek - 1];

  return (
    <div className="flex h-28 items-end gap-2">
      {bars.map((b, i) => {
        const isToday = b.label === todayLabel || (bars.length > 7 && i === bars.length - 1);
        const height = Math.max((b.revenue / maxRevenue) * maxH, b.revenue > 0 ? 4 : 2);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              style={{ height: `${height}px` }}
              className={`w-full rounded-t transition-all ${isToday ? "bg-[#D4AF37]" : "bg-[#D4AF37]/20"}`}
            />
            <span className="text-[9px] text-gray-600">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const t = useT();
  const [period, setPeriod] = useState<Period>("today");
  const { userName, branchName } = useTenant();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats(period);
  const { data: chartData } = useDailyRevenue(period);
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions(10);
  const { data: staffData, isLoading: staffLoading } = useStaffMembers();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryItems();
  const { data: branchesData, isLoading: branchesLoading } = useBranches();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses();
  const { data: queueData } = useQueueStats();

  const stats = statsData?.data ?? null;
  const transactions = transactionsData?.data ?? [];
  const staffMembers = staffData?.data ?? [];
  const inventoryItems = inventoryData?.data ?? [];
  const branches = branchesData?.data ?? [];
  const expenses = expensesData?.data ?? [];
  const queueStats = queueData?.data ?? { waiting: 0, inProgress: 0, completed: 0 };

  const lowStockItems = inventoryItems.filter(
    (i) => i.stock_qty != null && i.reorder_level != null && i.stock_qty <= i.reorder_level
  );
  const barbers = staffMembers.filter((s) => /barber/i.test(s.role ?? ""));
  const chartBars = chartData?.data ?? [];

  const isLoading =
    statsLoading ||
    transactionsLoading ||
    staffLoading ||
    inventoryLoading ||
    branchesLoading ||
    expensesLoading;

  const PERIODS = [
    { label: t.common.today, value: "today" as Period },
    { label: t.common.week, value: "week" as Period },
    { label: t.common.month, value: "month" as Period },
  ];

  const PERIOD_LABELS: Record<Period, { revenue: string; customers: string; transactions: string; chart: string }> = {
    today: {
      revenue: t.dashboard.revenueToday,
      customers: t.dashboard.customersToday,
      transactions: t.dashboard.transactionsToday,
      chart: t.dashboard.chartToday,
    },
    week: {
      revenue: t.dashboard.revenueWeek,
      customers: t.dashboard.customersWeek,
      transactions: t.dashboard.transactionsWeek,
      chart: t.dashboard.chartWeek,
    },
    month: {
      revenue: t.dashboard.revenueMonth,
      customers: t.dashboard.customersMonth,
      transactions: t.dashboard.transactionsMonth,
      chart: t.dashboard.chartMonth,
    },
  };

  const QUICK_ACTIONS = [
    { label: t.dashboard.addWalkIn, icon: PlusCircle, color: "text-[#D4AF37]", href: "/queue" },
    { label: t.dashboard.bookAppt, icon: CalendarPlus, color: "text-blue-400", href: "/appointments" },
    { label: t.dashboard.checkout, icon: CreditCard, color: "text-emerald-400", href: "/pos" },
    { label: t.dashboard.addCustomer, icon: Users, color: "text-purple-400", href: "/customers" }
  ];

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t.dashboard.greetingMorning
      : hour < 15
        ? t.dashboard.greetingAfternoon
        : t.dashboard.greetingEvening;

  const periodLabel =
    period === "today"
      ? t.dashboard.periodToday
      : period === "week"
        ? t.dashboard.periodWeek
        : t.dashboard.periodMonth;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-400">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {greeting}, {userName ?? "User"}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {t.dashboard.situationAt}{" "}
            <span className="font-medium text-[#D4AF37]">{branchName ?? "kedai"}</span>{" "}
            {periodLabel}.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-[#1a1a1a] p-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === value
                  ? "bg-[#2a2a2a] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {PERIOD_LABELS[period].revenue}
            </p>
            <span className="rounded-lg p-2 bg-emerald-500/10">
              <CircleDollarSign className="h-4 w-4 text-emerald-400" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">
              {stats ? formatAmount(stats.todayRevenue) : "RM 0.00"}
            </h3>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">{t.common.totalSales}</p>
        </Card>

        <Card className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {PERIOD_LABELS[period].customers}
            </p>
            <span className="rounded-lg p-2 bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-400" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">
              {stats?.todayCustomers ?? 0}
            </h3>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">{t.dashboard.uniqueCustomersServed}</p>
        </Card>

        <Card className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {PERIOD_LABELS[period].transactions}
            </p>
            <span className="rounded-lg p-2 bg-purple-500/10">
              <CircleDollarSign className="h-4 w-4 text-purple-400" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">
              {stats?.totalTransactions ?? 0}
            </h3>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {periodLabel}
          </p>
        </Card>

        <Card className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t.dashboard.activeQueue}
            </p>
            <span className="rounded-lg p-2 bg-amber-500/10">
              <Timer className="h-4 w-4 text-amber-400" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">{queueStats.waiting}</h3>
            <span className="text-sm font-normal text-gray-500">{t.dashboard.waiting}</span>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">{t.dashboard.todayMY}</p>
          <Link
            href="/queue-board"
            className="mt-3 block w-full rounded border border-white/10 py-1.5 text-center text-xs text-white transition hover:bg-white/5"
          >
            {t.dashboard.viewQueueBoard}
          </Link>
        </Card>
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Sales & Revenue chart */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{t.dashboard.salesRevenue}</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  {PERIOD_LABELS[period].chart}
                </p>
              </div>
              <BarChart2 className="h-5 w-5 text-[#D4AF37]" />
            </div>
            {chartBars.length > 0 ? (
              <MiniChart bars={chartBars} />
            ) : (
              <div className="flex h-28 items-center justify-center text-sm text-gray-600">
                {t.dashboard.noDataYet}
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]" />
                {periodLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]/20" />
                {t.dashboard.otherDays}
              </span>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">{t.dashboard.recentTransactions}</h3>
              <Link
                href="/reports"
                className="text-sm font-medium text-[#D4AF37] transition hover:text-[#D4AF37]/80"
              >
                {t.common.viewAll}
              </Link>
            </div>
            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-gray-500">
                  {t.dashboard.noDataYet}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">{t.dashboard.customer}</th>
                      <th className="p-4 text-left">{t.dashboard.payment}</th>
                      <th className="p-4 text-left">{t.dashboard.amount}</th>
                      <th className="p-4 text-left">{t.dashboard.status}</th>
                      <th className="p-4 text-left">{t.dashboard.date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-t border-white/[0.04] transition hover:bg-white/[0.02]"
                      >
                        <td className="p-4 font-medium text-white">
                          {tx.customer?.full_name ?? t.dashboard.walkIn}
                        </td>
                        <td className="p-4 text-gray-300">{tx.payment_method}</td>
                        <td className="p-4 font-bold text-white">
                          {formatAmount(tx.total_amount)}
                        </td>
                        <td className="p-4">
                          <StatusBadge
                            status={tx.payment_status}
                            color={
                              tx.payment_status?.toLowerCase() === "paid" ? "green" : "yellow"
                            }
                          />
                        </td>
                        <td className="p-4 text-gray-500">{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-5">
            <h3 className="mb-4 font-bold text-white">{t.dashboard.quickActions}</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-white/5 bg-[#111111] p-4 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/30 hover:bg-[#2a2a2a]"
                  >
                    <Icon className={`h-5 w-5 ${a.color}`} />
                    {a.label}
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Top Barbers */}
          <Card className="p-5">
            <h3 className="mb-4 font-bold text-white">{t.dashboard.topBarbersToday}</h3>
            {barbers.length === 0 ? (
              <p className="text-sm text-gray-500">{t.dashboard.noDataYet}</p>
            ) : (
              <div className="space-y-3">
                {barbers.slice(0, 5).map((b, idx) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#2a2a2a] text-sm font-bold text-white">
                        {b.full_name?.charAt(0) ?? "?"}
                      </div>
                      {idx === 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-bold text-black">
                          1
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{b.full_name}</p>
                      <p className="text-[10px] text-gray-500">{t.dashboard.barber}</p>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        idx === 0 ? "text-[#D4AF37]" : idx === 1 ? "text-gray-300" : "text-gray-400"
                      }`}
                    >
                      —
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Low Stock Alert */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-red-400">
                {t.dashboard.lowStockAlert}
              </h3>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500">{t.dashboard.noLowStock}</p>
            ) : (
              <>
                <ul className="space-y-2">
                  {lowStockItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between border-b border-red-500/10 pb-2 text-sm last:border-0"
                    >
                      <span className="text-gray-300">{item.name}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          (item.stock_qty ?? 0) <= 1
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {item.stock_qty ?? 0} {t.dashboard.left}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/inventory"
                  className="mt-4 flex w-full items-center justify-center gap-1 text-xs font-medium text-red-400 transition hover:text-red-300"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {t.dashboard.orderStock}
                </Link>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch Performance */}
        <Card>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h3 className="font-bold text-white">{t.dashboard.branchPerformance}</h3>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </div>
          {branches.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">{t.dashboard.noDataYet}</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{b.name}</p>
                    <p className="text-xs text-gray-500">
                      {b.is_hq ? t.common.hq : t.common.branch}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">—</p>
                    <p className="text-xs text-gray-500">{t.common.statsComingSoon}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Expenses */}
        <Card>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h3 className="font-bold text-white">{t.dashboard.recentExpenses}</h3>
            <Link
              href="/expenses"
              className="rounded-md bg-[#2a2a2a] px-3 py-1 text-xs text-white transition hover:bg-[#333]"
            >
              {t.common.addNew}
            </Link>
          </div>
          {expenses.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">{t.dashboard.noDataYet}</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {expenses.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {e.vendor ?? e.category ?? t.expenses.addExpense}
                    </p>
                    <p className="text-xs text-gray-500">{e.category ?? e.notes ?? "—"}</p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    - {formatAmount(e.amount ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
