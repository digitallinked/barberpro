"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  ImageIcon,
  PlusCircle,
  QrCode,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Timer,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import {
  useDashboardStats,
  useDailyRevenue,
  useTransactions,
  useStaffMembers,
  useInventoryItems,
  useBranches,
  useExpenses,
  useQueueStats,
  useBranchHref,
} from "@/hooks";
import { GettingStartedChecklist } from "@/components/getting-started-checklist";
import { useTenant } from "@/components/tenant-provider";
import { useMaybeBranchContext } from "@/components/branch-context";
import { useT } from "@/lib/i18n/language-context";
import { useSupabase } from "@/hooks/use-supabase";
import type { Period, TransactionWithItems } from "@/services/transactions";

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

function humanizePaymentMethod(m: string) {
  const map: Record<string, string> = { cash: "Cash", card: "Card", ewallet: "E-wallet", qr: "QR Pay", duitnow_qr: "DuitNow QR" };
  return map[m] ?? m.replace(/_/g, " ");
}

function MiniChart({ bars }: { bars: { label: string; revenue: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxRevenue = Math.max(...bars.map((b) => b.revenue), 1);
  const maxH = 80;
  const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const myNow = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const myDayOfWeek = myNow.getUTCDay(); // 0 = Sun
  const todayLabel =
    bars.length <= 7
      ? weekDayLabels[myDayOfWeek === 0 ? 6 : myDayOfWeek - 1]
      : null; // month view: highlight last bar

  // Y-axis: 3 evenly spaced tick values (0, mid, max)
  const yTicks = [maxRevenue, maxRevenue / 2, 0];
  const formatY = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);

  return (
    <div className="flex gap-2">
      {/* Y-axis labels */}
      <div className="flex flex-col justify-between pb-5 text-right">
        {yTicks.map((v, i) => (
          <span key={i} className="text-[9px] leading-none text-gray-600">
            {formatY(v)}
          </span>
        ))}
      </div>

      {/* Bars */}
      <div className="flex flex-1 items-end gap-1.5" style={{ height: "112px" }}>
        {bars.map((b, i) => {
          const isToday =
            todayLabel !== null ? b.label === todayLabel : i === bars.length - 1;
          const pct = b.revenue / maxRevenue;
          const height = Math.max(pct * maxH, b.revenue > 0 ? 5 : 2);
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={i}
              className="relative flex flex-1 flex-col items-center gap-1"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-1.5 z-10 whitespace-nowrap rounded bg-[#1a1a1a] border border-white/10 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
                  RM {b.revenue.toFixed(2)}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1a1a1a]" />
                </div>
              )}
              <div
                style={{ height: `${height}px` }}
                className={`w-full rounded-t transition-all ${
                  isHovered
                    ? "bg-[#D4AF37]"
                    : isToday
                    ? "bg-[#D4AF37]"
                    : b.revenue > 0
                    ? "bg-[#D4AF37]/40"
                    : "bg-white/5"
                }`}
              />
              <span className="text-[9px] text-gray-600">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [period, setPeriod] = useState<Period>("today");
  const [showWelcome, setShowWelcome] = useState(false);
  const { userName, userRole } = useTenant();
  const activeBranch = useMaybeBranchContext();
  const activeBranchName = activeBranch?.name ?? null;
  const isAllBranches = activeBranch === null;
  const bHref = useBranchHref();

  // Receipt modal state
  const [selectedTx, setSelectedTx] = useState<TransactionWithItems | null>(null);
  const [receiptSignedUrl, setReceiptSignedUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const openTxDetail = useCallback(async (tx: TransactionWithItems) => {
    setSelectedTx(tx);
    setReceiptSignedUrl(null);
    if (tx.proof_storage_path) {
      setReceiptLoading(true);
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(tx.proof_storage_path, 600);
      setReceiptSignedUrl(data?.signedUrl ?? null);
      setReceiptLoading(false);
    }
  }, [supabase]);

  const closeTxDetail = useCallback(() => {
    setSelectedTx(null);
    setReceiptSignedUrl(null);
  }, []);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }, [searchParams, router]);

  const { data: statsData, isLoading: statsLoading } = useDashboardStats(period);
  const { data: monthStatsData } = useDashboardStats("month");
  // Chart always shows the current week for context; stat cards reflect the selected period
  const chartPeriod: Period = period === "month" ? "month" : "week";
  const { data: chartData } = useDailyRevenue(chartPeriod);
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
      {/* Subscription activated banner */}
      {showWelcome && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-400">Subscription activated!</p>
            <p className="mt-0.5 text-sm text-emerald-400/70">
              Welcome back — your account is fully restored and all features are unlocked.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWelcome(false)}
            className="text-emerald-400/60 transition hover:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Getting Started checklist — shown to owners until all tasks complete */}
      <GettingStartedChecklist />

      {/* Welcome row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            {greeting}, {userName ?? "User"}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
            <span>
              {t.dashboard.situationAt}{" "}
              <span className="font-medium text-[#D4AF37]">
                {isAllBranches ? t.branches.allBranches : (activeBranchName ?? "kedai")}
              </span>{" "}
              {periodLabel}.
            </span>
            {userRole !== "owner" && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold capitalize text-gray-500">
                {userRole}
              </span>
            )}
          </p>
        </div>
        {/* Period selector — full-width pill on mobile */}
        <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-[#1a1a1a] p-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition sm:flex-none ${
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

      {/* ── Stat cards — 2 cols on mobile, 4 on xl ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
            <h3 className="text-xl font-bold text-white sm:text-2xl">
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

      {/* ── Financial Snapshot (this month) ── */}
      {(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthExpenses = expenses
          .filter((e) => {
            const raw = e.expense_date ?? e.created_at;
            if (!raw) return false;
            const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
            return d >= monthStart;
          });
        const approvedExpenses = monthExpenses.filter((e) => e.status === "approved").reduce((s, e) => s + (e.amount ?? 0), 0);
        const pendingCount = monthExpenses.filter((e) => (e.status ?? "pending") === "pending").length;
        const thisMonthRevenue = monthStatsData?.data?.todayRevenue ?? 0;
        const netEstimate = thisMonthRevenue - approvedExpenses;

        return (
          <div className="space-y-3">
            {pendingCount > 0 && (
              <Link
                href={bHref("/expenses")}
                className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 hover:border-yellow-500/30 transition-colors"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-yellow-400" />
                <p className="flex-1 text-sm text-yellow-400">
                  <span className="font-semibold">{pendingCount} expense{pendingCount !== 1 ? "s" : ""}</span> awaiting approval — approve to include in P&L
                </p>
                <span className="text-xs text-yellow-400/60">Review →</span>
              </Link>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Revenue (this month)</p>
                </div>
                <p className="text-lg font-bold text-emerald-400">{formatAmount(thisMonthRevenue)}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Approved Expenses</p>
                </div>
                <p className="text-lg font-bold text-red-400">{formatAmount(approvedExpenses)}</p>
                {pendingCount > 0 && <p className="text-[10px] text-yellow-600 mt-0.5">{pendingCount} pending</p>}
              </Card>
              <Card className={`p-4 ${netEstimate >= 0 ? "border-emerald-500/10" : "border-red-500/10"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Net Estimate</p>
                </div>
                <p className={`text-lg font-bold ${netEstimate >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatAmount(netEstimate)}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">excl. payroll</p>
              </Card>
            </div>
          </div>
        );
      })()}

      {/* ── Main grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Sales & Revenue chart */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{t.dashboard.salesRevenue}</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  {period === "month" ? PERIOD_LABELS[period].chart : "Daily revenue — this week"}
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
                <span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]/40" />
                {t.dashboard.otherDays}
              </span>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-5">
              <h3 className="font-bold text-white">{t.dashboard.recentTransactions}</h3>
              <Link
                href={bHref("/reports")}
                className="text-sm font-medium text-[#D4AF37] transition hover:text-[#D4AF37]/80"
              >
                {t.common.viewAll}
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                {t.dashboard.noDataYet}
              </div>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="divide-y divide-white/[0.04] sm:hidden">
                  {transactions.map((tx) => {
                    const isQr = tx.payment_method === "qr" || tx.payment_method === "duitnow_qr";
                    const hasProof = Boolean(tx.proof_storage_path);
                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => openTxDetail(tx)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.02]"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isQr ? "bg-[#D4AF37]/10" : "bg-white/5"}`}>
                          {isQr
                            ? <QrCode className="h-4 w-4 text-[#D4AF37]" />
                            : <Receipt className="h-4 w-4 text-gray-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {tx.customer?.full_name ?? t.dashboard.walkIn}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {humanizePaymentMethod(tx.payment_method)} · {formatDate(tx.created_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-bold text-white">
                            {formatAmount(tx.total_amount)}
                          </span>
                          {hasProof ? (
                            <span className="flex items-center gap-0.5 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400">
                              <ImageIcon className="h-2.5 w-2.5" /> Photo
                            </span>
                          ) : (
                            <StatusBadge
                              status={tx.payment_status}
                              color={tx.payment_status?.toLowerCase() === "paid" ? "green" : "yellow"}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop: full table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <th className="p-4 text-left">{t.dashboard.customer}</th>
                        <th className="p-4 text-left">{t.dashboard.payment}</th>
                        <th className="p-4 text-left">{t.dashboard.amount}</th>
                        <th className="p-4 text-left">{t.dashboard.status}</th>
                        <th className="p-4 text-left">{t.dashboard.date}</th>
                        <th className="p-4 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const isQr = tx.payment_method === "qr" || tx.payment_method === "duitnow_qr";
                        const hasProof = Boolean(tx.proof_storage_path);
                        return (
                          <tr
                            key={tx.id}
                            onClick={() => openTxDetail(tx)}
                            className="cursor-pointer border-t border-white/[0.04] transition hover:bg-white/[0.02]"
                          >
                            <td className="p-4 font-medium text-white">
                              {tx.customer?.full_name ?? t.dashboard.walkIn}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${isQr ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-white/5 text-gray-300"}`}>
                                {isQr && <QrCode className="h-3 w-3" />}
                                {humanizePaymentMethod(tx.payment_method)}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-white">
                              {formatAmount(tx.total_amount)}
                            </td>
                            <td className="p-4">
                              <StatusBadge
                                status={tx.payment_status}
                                color={tx.payment_status?.toLowerCase() === "paid" ? "green" : "yellow"}
                              />
                            </td>
                            <td className="p-4 text-gray-500">{formatDate(tx.created_at)}</td>
                            <td className="p-4 text-center">
                              {hasProof ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400">
                                  <ImageIcon className="h-3 w-3" /> View
                                </span>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-6">
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
                  href={bHref("/inventory")}
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
              href={bHref("/expenses")}
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

      {/* ── Transaction receipt modal ──────────────────────────────── */}
      {selectedTx && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeTxDetail}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Transaction detail"
            className="relative z-10 flex max-h-[min(92dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl sm:rounded-2xl"
            style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                {(selectedTx.payment_method === "qr" || selectedTx.payment_method === "duitnow_qr")
                  ? <QrCode className="h-5 w-5 text-[#D4AF37]" />
                  : <Receipt className="h-5 w-5 text-gray-400" />}
                <h2 className="font-bold text-white">Transaction detail</h2>
              </div>
              <button
                type="button"
                onClick={closeTxDetail}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/30 px-4 py-3">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{formatDate(selectedTx.created_at)}</p>
                </div>
                <div className="rounded-xl bg-black/30 px-4 py-3">
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {selectedTx.customer?.full_name ?? "Walk-in"}
                  </p>
                </div>
                <div className="rounded-xl bg-black/30 px-4 py-3">
                  <p className="text-xs text-gray-500">Payment</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-[#D4AF37]">
                    {(selectedTx.payment_method === "qr" || selectedTx.payment_method === "duitnow_qr") && <QrCode className="h-3.5 w-3.5" />}
                    {humanizePaymentMethod(selectedTx.payment_method)}
                  </p>
                </div>
                <div className="rounded-xl bg-black/30 px-4 py-3">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="mt-0.5 text-sm font-bold text-[#D4AF37]">{formatAmount(selectedTx.total_amount)}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Items</p>
                <div className="overflow-hidden rounded-xl border border-white/5">
                  {selectedTx.transaction_items.map((item, i) => (
                    <div key={item.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} × {formatAmount(item.unit_price)}</p>
                      </div>
                      <span className="ml-4 shrink-0 text-sm font-semibold text-gray-200">{formatAmount(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Receipt photo */}
              {selectedTx.proof_storage_path && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">QR / DuitNow Payment Receipt</p>
                  {receiptLoading ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-white/5 bg-black/30">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
                    </div>
                  ) : receiptSignedUrl ? (
                    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={receiptSignedUrl} alt="Payment receipt" className="max-h-64 w-full object-contain" />
                      <a
                        href={receiptSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open full size
                      </a>
                    </div>
                  ) : (
                    <div className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-sm text-gray-500">
                      Could not load receipt photo
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
