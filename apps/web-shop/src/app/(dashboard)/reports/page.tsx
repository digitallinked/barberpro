"use client";

import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Download,
  DollarSign,
  FileText,
  Lock,
  Package,
  Receipt,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import { useT } from "@/lib/i18n/language-context";

import {
  useTransactions,
  useStaffMembers,
  useCustomers,
  useCustomerStats,
  useInventoryItems,
  useInventoryStats,
  useExpenses,
  useExpenseStats,
  useAllPayrollEntries,
  useBranches,
  useStaffAssignments,
  useAttendanceSummaries,
} from "@/hooks";
import { commissionAmountsFromScheme } from "@/lib/payroll-calculator";
import { useTenant } from "@/components/tenant-provider";
import type { TransactionWithItems } from "@/services/transactions";
import {
  calculateAnnualTax,
  calculateStatutoryDeductions,
  PERSONAL_RELIEF,
  SST_RATE,
  TAX_BRACKETS_DISPLAY,
  formatRM,
} from "@/lib/malaysian-tax";
import { openPrintableDocument } from "@/lib/print-pdf";
import { downloadCsv } from "@/lib/csv-download";
import {
  AnnualTaxSummaryChart,
  CustomerSpendBarChart,
  EmployerStatutoryBar,
  ExpenseCategoryChart,
  InventoryValueChart,
  PaymentMixChart,
  PlTrendChart,
  RevenueTrendChart,
  ServiceProductDonut,
  StaffRevenueBarChart,
  TopServicesBarChart,
} from "./reports-charts";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>
  );
}

function formatAmount(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function humanizePaymentMethod(m: string): string {
  const map: Record<string, string> = {
    cash: "Cash",
    card: "Card",
    ewallet: "E-wallet",
    qr: "QR Pay",
    duitnow_qr: "DuitNow QR",
  };
  return map[m] ?? m.replace(/_/g, " ");
}

const TABS = [
  { id: "revenue",    label: "Revenue",         icon: DollarSign },
  { id: "staff",      label: "Staff",            icon: Users },
  { id: "attendance", label: "Attendance",       icon: CalendarDays },
  { id: "customers",  label: "Customers",        icon: Users },
  { id: "inventory",  label: "Inventory",        icon: Package },
  { id: "expenses",   label: "Expenses",         icon: Receipt },
  { id: "pnl",        label: "P&L",             icon: TrendingUp },
  { id: "annual_tax", label: "Annual tax (MY)",  icon: Scale },
] as const;

const PRO_ONLY_TABS = new Set<string>(["pnl", "annual_tax", "attendance"]);

type TabId = (typeof TABS)[number]["id"];

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

/** How to interpret year + monthIndex for filtering */
type PeriodScope = "month" | "year" | "rolling_30" | "all";

function periodBounds(
  scope: PeriodScope,
  year: number,
  monthIndex: number
): { start: Date; end: Date } | null {
  const now = new Date();
  if (scope === "all") return null;
  if (scope === "rolling_30") {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    start.setDate(start.getDate() - 29);
    return { start, end };
  }
  if (scope === "year") {
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }
  return {
    start: new Date(year, monthIndex, 1, 0, 0, 0, 0),
    end: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
  };
}

function periodLabel(scope: PeriodScope, year: number, monthIndex: number): string {
  if (scope === "all") return "All loaded data";
  if (scope === "rolling_30") return "Last 30 days";
  if (scope === "year") return `Year ${year}`;
  return new Date(year, monthIndex, 1).toLocaleString("en-MY", { month: "long", year: "numeric" });
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function filterTransactionsByPeriod(
  txs: TransactionWithItems[],
  scope: PeriodScope,
  year: number,
  monthIndex: number
): TransactionWithItems[] {
  const b = periodBounds(scope, year, monthIndex);
  if (!b) return txs;
  return txs.filter((t) => {
    const d = new Date(t.created_at);
    return d >= b.start && d <= b.end;
  });
}

function priorPeriodBounds(
  scope: PeriodScope,
  year: number,
  monthIndex: number
): { start: Date; end: Date } | null {
  if (scope === "month") {
    const prev = new Date(year, monthIndex - 1, 1);
    return {
      start: new Date(prev.getFullYear(), prev.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(prev.getFullYear(), prev.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (scope === "rolling_30") {
    const end = new Date();
    end.setDate(end.getDate() - 30);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (scope === "year") {
    const y = year - 1;
    return {
      start: new Date(y, 0, 1, 0, 0, 0, 0),
      end: new Date(y, 11, 31, 23, 59, 59, 999),
    };
  }
  return null;
}

const MONTH_OPTIONS = [
  { v: 0, label: "January" },
  { v: 1, label: "February" },
  { v: 2, label: "March" },
  { v: 3, label: "April" },
  { v: 4, label: "May" },
  { v: 5, label: "June" },
  { v: 6, label: "July" },
  { v: 7, label: "August" },
  { v: 8, label: "September" },
  { v: 9, label: "October" },
  { v: 10, label: "November" },
  { v: 11, label: "December" },
];

export default function ReportsPage() {
  const t = useT();
  const { tenantName, tenantPlan } = useTenant();
  const isStarter = tenantPlan === "starter";
  const [activeTab, setActiveTab] = useState<TabId>("revenue");
  const [taxYear, setTaxYear] = useState(() => new Date().getFullYear() - 1);
  const [periodScope, setPeriodScope] = useState<PeriodScope>("month");
  const [periodYear, setPeriodYear] = useState(() => new Date().getFullYear());
  const [periodMonthIndex, setPeriodMonthIndex] = useState(() => new Date().getMonth());
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const plCalendarYear = new Date().getFullYear();
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions(5000);
  const { data: payrollPlData } = useAllPayrollEntries(plCalendarYear);
  const { data: payrollTaxYearData } = useAllPayrollEntries(taxYear);
  const { data: staffData, isLoading: staffLoading } = useStaffMembers();
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { data: customerStatsData } = useCustomerStats();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryItems();
  const { data: inventoryStatsData } = useInventoryStats();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses();
  const { data: expenseStatsData } = useExpenseStats();
  const { data: branchesData } = useBranches();
  const { data: assignmentsResult } = useStaffAssignments();

  const reportAttRange = useMemo(() => {
    const b = periodBounds(periodScope, periodYear, periodMonthIndex);
    if (b) return { start: localDateStr(b.start), end: localDateStr(b.end) };
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return { start: localDateStr(start), end: localDateStr(end) };
  }, [periodScope, periodYear, periodMonthIndex]);

  const { data: attendanceSummariesResult } = useAttendanceSummaries(
    reportAttRange.start,
    reportAttRange.end
  );

  useEffect(() => {
    function close(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const transactions = transactionsData?.data ?? [];
  const staffMembers = staffData?.data ?? [];
  const customers = customersData?.data ?? [];
  const customerStats = customerStatsData?.data ?? { total: 0, newThisMonth: 0 };
  const inventoryItems = inventoryData?.data ?? [];
  const inventoryStats = inventoryStatsData?.data ?? { totalItems: 0, lowStock: 0 };
  const expenses = expensesData?.data ?? [];
  const expenseStats = expenseStatsData?.data ?? { total: 0, thisMonth: 0 };
  const branches = branchesData?.data ?? [];
  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name] as const)),
    [branches]
  );

  const periodLabelStr = useMemo(
    () => periodLabel(periodScope, periodYear, periodMonthIndex),
    [periodScope, periodYear, periodMonthIndex]
  );

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    let minY = cy;
    for (const t of transactions) {
      const y = new Date(t.created_at).getFullYear();
      if (!Number.isNaN(y) && y < minY) minY = y;
    }
    const start = Math.min(minY, cy - 10);
    const end = cy + 1;
    return Array.from({ length: end - start + 1 }, (_, i) => end - i);
  }, [transactions]);

  const exportPeriodSlug = useMemo(
    () =>
      periodLabelStr
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toLowerCase() || "period",
    [periodLabelStr]
  );

  const filteredTx = useMemo(
    () => filterTransactionsByPeriod(transactions, periodScope, periodYear, periodMonthIndex),
    [transactions, periodScope, periodYear, periodMonthIndex]
  );

  const priorTx = useMemo(() => {
    const pb = priorPeriodBounds(periodScope, periodYear, periodMonthIndex);
    if (!pb) return [] as TransactionWithItems[];
    return transactions.filter((t) => {
      const d = new Date(t.created_at);
      return d >= pb.start && d <= pb.end;
    });
  }, [transactions, periodScope, periodYear, periodMonthIndex]);

  // Revenue & shared analytics for selected range
  const revenueStats = useMemo(() => {
    const monthTx = filteredTx;
    const totalRevenue = monthTx.reduce((sum, t) => sum + t.total_amount, 0);
    const totalSubtotal = monthTx.reduce((sum, t) => sum + t.subtotal, 0);
    const totalTax = monthTx.reduce((sum, t) => sum + t.tax_amount, 0);
    const count = monthTx.length;
    const avg = count > 0 ? totalRevenue / count : 0;
    const priorRev = priorTx.reduce((s, t) => s + t.total_amount, 0);
    const vsPriorPct = priorRev > 0 ? ((totalRevenue - priorRev) / priorRev) * 100 : null;

    const byMonth = periodScope === "year";
    const bucket = monthTx.reduce<Record<string, { total: number; count: number }>>((acc, t) => {
      const d = new Date(t.created_at);
      const key = byMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : (t.created_at.split("T")[0] ?? "");
      if (!acc[key]) acc[key] = { total: 0, count: 0 };
      acc[key]!.total += t.total_amount;
      acc[key]!.count += 1;
      return acc;
    }, {});

    const breakdown = Object.entries(bucket)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(byMonth ? 24 : 31);

    const breakdownGranularity: "day" | "month" = byMonth ? "month" : "day";

    const paymentMix = monthTx.reduce<Record<string, number>>((acc, t) => {
      const m = t.payment_method ?? "unknown";
      acc[m] = (acc[m] ?? 0) + t.total_amount;
      return acc;
    }, {});

    const paymentRows = Object.entries(paymentMix)
      .map(([method, amount]) => ({ method, amount, pct: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    const serviceRevenue = monthTx.reduce((s, t) => {
      let x = 0;
      for (const it of t.transaction_items) {
        if (it.item_type === "service") x += it.line_total;
      }
      return s + x;
    }, 0);
    const productRevenue = monthTx.reduce((s, t) => {
      let x = 0;
      for (const it of t.transaction_items) {
        if (it.item_type === "product" || it.item_type === "retail") x += it.line_total;
      }
      return s + x;
    }, 0);

    const serviceLines = new Map<string, { qty: number; revenue: number }>();
    for (const t of monthTx) {
      for (const it of t.transaction_items) {
        if (it.item_type !== "service") continue;
        const key = it.name || "Service";
        const cur = serviceLines.get(key) ?? { qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.line_total;
        serviceLines.set(key, cur);
      }
    }
    const topServices = Array.from(serviceLines.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      totalRevenue,
      totalSubtotal,
      totalTax,
      count,
      avg,
      vsPriorPct,
      breakdown,
      breakdownGranularity,
      paymentRows,
      serviceRevenue,
      productRevenue,
      topServices,
    };
  }, [filteredTx, priorTx, periodScope]);

  const assignmentsList = assignmentsResult?.data ?? [];

  const staffPerformance = useMemo(() => {
    const b = periodBounds(periodScope, periodYear, periodMonthIndex);
    const periodStartStr = b ? localDateStr(b.start) : null;
    const periodEndStr = b ? localDateStr(b.end) : null;

    function schemeForStaff(staffProfileId: string) {
      if (!periodStartStr || !periodEndStr) return null;
      const candidates = assignmentsList
        .filter((a) => a.staff_id === staffProfileId)
        .filter((a) => String(a.effective_from).slice(0, 10) <= periodEndStr)
        .filter((a) => !a.effective_to || String(a.effective_to).slice(0, 10) >= periodStartStr)
        .sort((a, b) => String(b.effective_from).localeCompare(String(a.effective_from)));
      return candidates[0]?.scheme ?? null;
    }

    const byStaff = new Map<
      string,
      {
        revenue: number;
        lineItems: number;
        txIds: Set<string>;
        serviceRevenue: number;
        productRevenue: number;
        servicesCount: number;
        customerIds: Set<string>;
      }
    >();
    for (const t of filteredTx) {
      if (t.payment_status === "cancelled") continue;
      for (const it of t.transaction_items) {
        if (!it.staff_id) continue;
        const cur = byStaff.get(it.staff_id) ?? {
          revenue: 0,
          lineItems: 0,
          txIds: new Set<string>(),
          serviceRevenue: 0,
          productRevenue: 0,
          servicesCount: 0,
          customerIds: new Set<string>(),
        };
        cur.revenue += it.line_total;
        cur.lineItems += it.quantity;
        cur.txIds.add(t.id);
        const qty = it.quantity || 1;
        if (it.item_type === "service") {
          cur.serviceRevenue += it.line_total;
          cur.servicesCount += qty;
        } else if (it.item_type === "product") {
          cur.productRevenue += it.line_total;
        } else {
          cur.serviceRevenue += it.line_total;
          cur.servicesCount += qty;
        }
        if (t.customer_id) cur.customerIds.add(t.customer_id);
        byStaff.set(it.staff_id, cur);
      }
    }
    return staffMembers
      .map((s) => {
        const m = byStaff.get(s.staff_profile_id);
        const txCount = m?.txIds.size ?? 0;
        const revenue = m?.revenue ?? 0;
        const items = m?.lineItems ?? 0;
        const serviceRevenue = m?.serviceRevenue ?? 0;
        const productRevenue = m?.productRevenue ?? 0;
        const servicesCount = m?.servicesCount ?? 0;
        const customersServed = m?.customerIds.size ?? 0;
        const sch = schemeForStaff(s.staff_profile_id);
        const { serviceCommission, productCommission } = commissionAmountsFromScheme(
          sch
            ? {
                percentage_rate: sch.percentage_rate,
                per_service_amount: sch.per_service_amount,
                per_customer_amount: sch.per_customer_amount,
                product_commission_rate: sch.product_commission_rate,
                is_active: sch.is_active,
              }
            : null,
          { serviceRevenue, productRevenue, servicesCount, customersServed }
        );
        const commissionEarned = serviceCommission + productCommission;
        return {
          ...s,
          attributedRevenue: revenue,
          transactionCount: txCount,
          lineItemQty: items,
          avgPerTx: txCount > 0 ? revenue / txCount : 0,
          branchLabel: s.branch_id ? branchNameById.get(s.branch_id) ?? "—" : "—",
          commissionEarned,
        };
      })
      .sort((a, b) => b.attributedRevenue - a.attributedRevenue);
  }, [
    filteredTx,
    staffMembers,
    branchNameById,
    assignmentsList,
    periodScope,
    periodYear,
    periodMonthIndex,
  ]);

  const customerSpend = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; visits: number; spend: number; lastAt: string }
    >();
    for (const t of filteredTx) {
      if (!t.customer_id) continue;
      const cur = map.get(t.customer_id) ?? {
        name: t.customer?.full_name ?? "Customer",
        phone: t.customer?.phone ?? "",
        visits: 0,
        spend: 0,
        lastAt: t.created_at,
      };
      cur.visits += 1;
      cur.spend += t.total_amount;
      if (new Date(t.created_at) > new Date(cur.lastAt)) cur.lastAt = t.created_at;
      if (t.customer?.full_name) cur.name = t.customer.full_name;
      if (t.customer?.phone) cur.phone = t.customer.phone;
      map.set(t.customer_id, cur);
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 25);
  }, [filteredTx]);

  const expensesInRange = useMemo(() => {
    const b = periodBounds(periodScope, periodYear, periodMonthIndex);
    return expenses.filter((e) => {
      const raw = e.expense_date ?? e.created_at;
      if (!raw) return false;
      const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
      if (!b) return true;
      return d >= b.start && d <= b.end;
    });
  }, [expenses, periodScope, periodYear, periodMonthIndex]);

  const expensesRangeTotal = useMemo(
    () => expensesInRange.reduce((s, e) => s + (e.amount ?? 0), 0),
    [expensesInRange]
  );

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expensesInRange) {
      const cat = e.category ?? "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + (e.amount ?? 0));
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expensesInRange]);

  const lowStockItems = inventoryItems.filter(
    (i) => i.stock_qty != null && i.reorder_level != null && i.stock_qty <= i.reorder_level
  );

  const payrollPlEntries = payrollPlData?.data ?? [];
  const payrollTaxYearEntries = payrollTaxYearData?.data ?? [];

  const inventoryValuation = useMemo(() => {
    let cost = 0;
    let retail = 0;
    for (const i of inventoryItems) {
      const q = i.stock_qty ?? 0;
      cost += q * (i.unit_cost ?? 0);
      retail += q * (i.sell_price ?? 0);
    }
    return { cost, retail };
  }, [inventoryItems]);

  // P&L summary (monthly) — current year
  const plByMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => ({
      label: new Date(year, i, 1).toLocaleString("en-MY", { month: "short" }),
      revenue: 0,
      expenses: 0,
      payroll: 0,
      payrollBase: 0,
      payrollCommission: 0,
      payrollBonus: 0,
    }));
    for (const tx of transactions) {
      const d = new Date(tx.created_at);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        if (months[m]) months[m].revenue += tx.total_amount ?? 0;
      }
    }
    for (const ex of expenses) {
      const raw = ex.expense_date ?? ex.created_at;
      if (!raw) continue;
      const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        if (months[m]) months[m].expenses += ex.amount ?? 0;
      }
    }
    for (const e of payrollPlEntries) {
      const d = new Date(e.created_at);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        if (months[m]) {
          months[m].payroll += e.net_payout ?? 0;
          months[m].payrollBase += e.base_salary ?? 0;
          months[m].payrollCommission += (e.service_commission ?? 0) + (e.product_commission ?? 0);
          months[m].payrollBonus += e.bonuses ?? 0;
        }
      }
    }
    return months.slice(0, now.getMonth() + 1);
  }, [transactions, expenses, payrollPlEntries]);

  const plTotals = useMemo(() => {
    const revenue = plByMonth.reduce((s, m) => s + m.revenue, 0);
    const expenses2 = plByMonth.reduce((s, m) => s + m.expenses, 0);
    const payroll = plByMonth.reduce((s, m) => s + m.payroll, 0);
    const payrollBase = plByMonth.reduce((s, m) => s + m.payrollBase, 0);
    const payrollCommission = plByMonth.reduce((s, m) => s + m.payrollCommission, 0);
    const payrollBonus = plByMonth.reduce((s, m) => s + m.payrollBonus, 0);
    const grossProfit = revenue - expenses2 - payroll;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    return {
      revenue,
      expenses: expenses2,
      payroll,
      payrollBase,
      payrollCommission,
      payrollBonus,
      grossProfit,
      margin,
    };
  }, [plByMonth]);

  const revenueTrendChartData = useMemo(() => {
    const sorted = [...revenueStats.breakdown].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((r) => ({
      label:
        revenueStats.breakdownGranularity === "month"
          ? new Date(`${r.date}-01T12:00:00`).toLocaleString("en-MY", { month: "short", year: "2-digit" })
          : formatDate(`${r.date}T12:00:00`),
      revenue: r.total,
      txs: r.count,
    }));
  }, [revenueStats.breakdown, revenueStats.breakdownGranularity]);

  const paymentMixChartData = useMemo(
    () =>
      revenueStats.paymentRows.map((r) => ({
        name: humanizePaymentMethod(r.method),
        value: r.amount,
      })),
    [revenueStats.paymentRows]
  );

  const staffChartData = useMemo(
    () =>
      staffPerformance.map((s) => ({
        name: s.full_name,
        revenue: s.attributedRevenue,
      })),
    [staffPerformance]
  );

  const plChartData = useMemo(
    () =>
      plByMonth.map((m) => {
        const profit = m.revenue - m.expenses - m.payroll;
        return {
          label: m.label,
          revenue: m.revenue,
          expenses: m.expenses,
          payroll: m.payroll,
          profit,
        };
      }),
    [plByMonth]
  );

  // Employer statutory for annual tax tab
  const employerStatutoryForYear = useMemo(() => {
    let epf = 0, socso = 0, eis = 0, totalCost = 0;
    for (const e of payrollTaxYearEntries) {
      const gross = e.base_salary + e.service_commission + e.product_commission + e.bonuses;
      const stat = calculateStatutoryDeductions(gross);
      epf       += stat.epf.employerContribution;
      socso     += stat.socso.employerContribution;
      eis       += stat.eis.employerContribution;
      totalCost += stat.totalEmployerCost;
    }
    return { epf: Math.round(epf * 100) / 100, socso: Math.round(socso * 100) / 100, eis: Math.round(eis * 100) / 100, totalCost: Math.round(totalCost * 100) / 100 };
  }, [payrollTaxYearEntries]);

  // Malaysian filing deadlines for the selected taxYear
  const filingDeadlines = useMemo(() => {
    const y = taxYear;
    const next = y + 1;
    return [
      { label: "SST return (Jan–Jun)",      date: `31 Aug ${y}`,         description: "RMCD biannual SST-02 return for Jan–Jun period" },
      { label: "SST return (Jul–Dec)",       date: `28 Feb ${next}`,      description: "RMCD biannual SST-02 return for Jul–Dec period" },
      { label: "CP204 1st instalment",       date: `2 months before YA`,  description: "Estimate of tax payable; pay monthly/bi-monthly to LHDN" },
      { label: "EA forms to employees",      date: `28 Feb ${next}`,      description: "Employer issues EA form to each employee — required before filing" },
      { label: "e-Data PCB submission",      date: `31 Mar ${next}`,      description: "Employer submits e-Data PCB (MTD) to LHDN" },
      { label: "Form B (self-employed)",     date: `30 Jun ${next}`,      description: "Individual with business income files Form B (e-Filing)" },
      { label: "Form BE (employment only)",  date: `30 Apr ${next}`,      description: "Individual with employment income only (Form BE)" },
      { label: "KWSP (EPF) — monthly",       date: "15th of each month",  description: "Monthly EPF contributions for both employee and employer" },
      { label: "SOCSO / EIS — monthly",      date: "15th of each month",  description: "Monthly SOCSO + EIS contributions via PERKESO portal" },
    ];
  }, [taxYear]);

  const annualTaxData = useMemo(() => {
    const start = new Date(taxYear, 0, 1);
    const end = new Date(taxYear, 11, 31, 23, 59, 59, 999);
    let grossRevenue = 0;
    let taxCollected = 0;
    for (const tx of transactions) {
      const d = new Date(tx.created_at);
      if (d >= start && d <= end) {
        grossRevenue += tx.total_amount ?? 0;
        taxCollected += tx.tax_amount ?? 0;
      }
    }
    let expenseTotal = 0;
    for (const ex of expenses) {
      const raw = ex.expense_date ?? ex.created_at;
      if (!raw) continue;
      const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
      if (d >= start && d <= end) expenseTotal += ex.amount ?? 0;
    }
    const summary = calculateAnnualTax(grossRevenue, expenseTotal, PERSONAL_RELIEF, taxYear);
    return { grossRevenue, taxCollected, expenseTotal, summary };
  }, [transactions, expenses, taxYear]);

  function printAnnualTaxPack() {
    const { grossRevenue, taxCollected, expenseTotal, summary } = annualTaxData;
    const bracketRows = TAX_BRACKETS_DISPLAY.map(
      (b) => `<tr><td>${escAttr(b.range)}</td><td style="text-align:right">${escAttr(b.rate)}</td></tr>`
    ).join("");
    const payrollNetTotal = payrollTaxYearEntries.reduce((s, e) => s + e.net_payout, 0);

    const inner = `
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#111;max-width:720px;margin:0 auto}
h1{font-size:20px} h2{font-size:14px;margin-top:24px;border-top:1px solid #eee;padding-top:12px} table{width:100%;border-collapse:collapse;font-size:12px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd} .n{text-align:right;font-variant-numeric:tabular-nums}
.muted{font-size:11px;color:#666;line-height:1.5;margin-top:16px}
</style>
<h1>Annual tax working paper (Malaysia)</h1>
<p><strong>${escAttr(tenantName)}</strong> · Assessment year ${taxYear} (calendar ${taxYear})</p>
<h2>Business summary (from BarberPro)</h2>
<table>
<tr><td>Gross receipts (paid transactions)</td><td class="n">${escAttr(formatRM(grossRevenue))}</td></tr>
<tr><td>SST / service tax recorded on sales</td><td class="n">${escAttr(formatRM(taxCollected))}</td></tr>
<tr><td>Recorded expenses (${taxYear})</td><td class="n">${escAttr(formatRM(expenseTotal))}</td></tr>
<tr><td>Payroll net payout (${taxYear})</td><td class="n">${escAttr(formatRM(payrollNetTotal))}</td></tr>
<tr><td><strong>Net business income (app estimate)</strong></td><td class="n"><strong>${escAttr(formatRM(summary.netBusinessIncome))}</strong></td></tr>
</table>
<h2>Individual tax estimate (Form B style — simplified)</h2>
<table>
<tr><td>Personal relief (placeholder)</td><td class="n">${escAttr(formatRM(summary.personalRelief))}</td></tr>
<tr><td>Estimated chargeable income</td><td class="n">${escAttr(formatRM(summary.chargeableIncome))}</td></tr>
<tr><td><strong>Estimated tax (progressive resident)</strong></td><td class="n"><strong>${escAttr(formatRM(summary.estimatedTax))}</strong></td></tr>
<tr><td>Suggested monthly instalment (÷12)</td><td class="n">${escAttr(formatRM(summary.monthlyInstalment))}</td></tr>
</table>
<h2>Employer statutory obligations (estimate)</h2>
<table>
<tr><td>EPF employer contributions</td><td class="n">${escAttr(formatRM(employerStatutoryForYear.epf))}</td></tr>
<tr><td>SOCSO employer contributions</td><td class="n">${escAttr(formatRM(employerStatutoryForYear.socso))}</td></tr>
<tr><td>EIS employer contributions</td><td class="n">${escAttr(formatRM(employerStatutoryForYear.eis))}</td></tr>
<tr><td><strong>Total employer cost (wages + levies)</strong></td><td class="n"><strong>${escAttr(formatRM(employerStatutoryForYear.totalCost))}</strong></td></tr>
</table>
<h2>Resident tax bands (reference)</h2>
<table><thead><tr><th>Chargeable income</th><th style="text-align:right">Rate</th></tr></thead><tbody>${bracketRows}</tbody></table>
<h2>Key filing deadlines (YA ${taxYear})</h2>
<table><thead><tr><th>Obligation</th><th>Deadline</th></tr></thead><tbody>${filingDeadlines.map(d => `<tr><td>${escAttr(d.label)}</td><td>${escAttr(d.date)}</td></tr>`).join("")}</tbody></table>
<p class="muted">SST on POS uses ${Math.round(SST_RATE * 100)}% service tax rate (effective Mar 2024). Registration with RMCD and e-invoicing (LHDN / MyInvois) are separate obligations. This sheet is not tax advice; file via MyTax / LHDN and use a qualified tax agent for Form B, CP204, EA/PCB matters.</p>`;
    openPrintableDocument(inner, `Annual-tax-MY-${taxYear}`);
  }

  const exportFileSlug = `${activeTab}-${exportPeriodSlug}-${new Date().toISOString().slice(0, 10)}`;

  function buildCurrentTabPdfBody(): string {
    const rangeLabel = escAttr(periodLabelStr);
    const h = (s: string) => `<h2>${escAttr(s)}</h2>`;
    switch (activeTab) {
      case "revenue": {
        const sum = `<p><strong>Range:</strong> ${rangeLabel}</p>
          <p>Total revenue: ${escAttr(formatAmount(revenueStats.totalRevenue))} · Subtotal: ${escAttr(formatAmount(revenueStats.totalSubtotal))} · SST: ${escAttr(formatAmount(revenueStats.totalTax))}</p>
          <p>Transactions: ${revenueStats.count} · Avg ticket: ${escAttr(formatAmount(revenueStats.avg))}</p>`;
        const timeLabel = revenueStats.breakdownGranularity === "month" ? "Month" : "Date";
        const daily = revenueStats.breakdown
          .map((r) => {
            const cell =
              revenueStats.breakdownGranularity === "month"
                ? new Date(r.date + "-01T12:00:00").toLocaleString("en-MY", { month: "short", year: "numeric" })
                : r.date;
            return `<tr><td>${escAttr(cell)}</td><td>${r.count}</td><td class="n">${escAttr(formatAmount(r.total))}</td></tr>`;
          })
          .join("");
        const pay = revenueStats.paymentRows
          .map(
            (r) =>
              `<tr><td>${escAttr(humanizePaymentMethod(r.method))}</td><td class="n">${escAttr(formatAmount(r.amount))}</td><td class="n">${r.pct.toFixed(1)}%</td></tr>`
          )
          .join("");
        const svc = revenueStats.topServices
          .map(
            (r) =>
              `<tr><td>${escAttr(r.name)}</td><td class="n">${r.qty}</td><td class="n">${escAttr(formatAmount(r.revenue))}</td></tr>`
          )
          .join("");
        return `${sum}${h(revenueStats.breakdownGranularity === "month" ? "Monthly breakdown" : "Daily breakdown")}<table><tr><th>${timeLabel}</th><th>Tx</th><th class="n">Revenue</th></tr>${daily}</table>
          ${h("Payment methods")}<table><tr><th>Method</th><th class="n">Amount</th><th class="n">%</th></tr>${pay}</table>
          ${h("Top services")}<table><tr><th>Service</th><th class="n">Qty</th><th class="n">Revenue</th></tr>${svc}</table>`;
      }
      case "staff": {
        const rows = staffPerformance
          .map(
            (s) =>
              `<tr><td>${escAttr(s.full_name)}</td><td>${escAttr(s.role ?? "")}</td><td>${escAttr(s.branchLabel)}</td><td class="n">${escAttr(formatAmount(s.attributedRevenue))}</td><td class="n">${escAttr(formatAmount(s.commissionEarned))}</td><td class="n">${s.transactionCount}</td><td class="n">${escAttr(formatAmount(s.avgPerTx))}</td></tr>`
          )
          .join("");
        return `<p><strong>Range:</strong> ${rangeLabel}</p>${h("Staff performance")}<table><tr><th>Name</th><th>Role</th><th>Branch</th><th class="n">Revenue</th><th class="n">Comm.(est.)</th><th class="n">Tx</th><th class="n">Avg/tx</th></tr>${rows}</table>`;
      }
      case "attendance": {
        const rows = (attendanceSummariesResult?.data ?? [])
          .map((row) => {
            const denom = row.daysPresent + row.daysLate + row.daysHalfDay + row.daysAbsent + row.daysLeave;
            const worked = row.daysPresent + row.daysLate + row.daysHalfDay;
            const rate = denom > 0 ? ((worked / denom) * 100).toFixed(0) : "—";
            return `<tr><td>${escAttr(row.staffName)}</td><td class="n">${row.daysPresent}</td><td class="n">${row.daysLate}</td><td class="n">${row.daysHalfDay}</td><td class="n">${row.daysAbsent}</td><td class="n">${row.daysLeave}</td><td class="n">${row.totalRecords}</td><td class="n">${rate}${rate === "—" ? "" : "%"}</td></tr>`;
          })
          .join("");
        return `<p><strong>Range:</strong> ${escAttr(reportAttRange.start)} – ${escAttr(reportAttRange.end)}</p>${h("Attendance")}<table><tr><th>Staff</th><th class="n">Present</th><th class="n">Late</th><th class="n">Half</th><th class="n">Absent</th><th class="n">Leave</th><th class="n">Logged</th><th class="n">Rate</th></tr>${rows}</table>`;
      }
      case "customers": {
        const rows = customerSpend
          .map(
            (c) =>
              `<tr><td>${escAttr(c.name)}</td><td>${escAttr(c.phone)}</td><td class="n">${c.visits}</td><td class="n">${escAttr(formatAmount(c.spend))}</td><td>${escAttr(c.lastAt.split("T")[0] ?? "")}</td></tr>`
          )
          .join("");
        return `<p><strong>Range:</strong> ${rangeLabel}</p>${h("Customer spend (with transactions)")}<table><tr><th>Name</th><th>Phone</th><th class="n">Visits</th><th class="n">Spend</th><th>Last visit</th></tr>${rows}</table>`;
      }
      case "inventory": {
        const list = lowStockItems.length > 0 ? lowStockItems : inventoryItems.slice(0, 100);
        const low = list
          .map(
            (i) =>
              `<tr><td>${escAttr(i.name)}</td><td class="n">${i.stock_qty ?? 0}</td><td class="n">${i.reorder_level ?? 0}</td></tr>`
          )
          .join("");
        return `<p>Stock at cost: ${escAttr(formatAmount(inventoryValuation.cost))} · At retail: ${escAttr(formatAmount(inventoryValuation.retail))}</p>
          ${h(lowStockItems.length > 0 ? "Low stock" : "Inventory snapshot")}<table><tr><th>Item</th><th class="n">Stock</th><th class="n">Reorder</th></tr>${low}</table>`;
      }
      case "expenses": {
        const cat = expensesByCategory
          .map((r) => `<tr><td>${escAttr(r.category)}</td><td class="n">${escAttr(formatAmount(r.total))}</td></tr>`)
          .join("");
        const recent = expensesInRange
          .slice(0, 40)
          .map(
            (e) =>
              `<tr><td>${escAttr((e.expense_date ?? e.created_at).split("T")[0] ?? "")}</td><td>${escAttr(e.category)}</td><td class="n">${escAttr(formatAmount(e.amount ?? 0))}</td><td>${escAttr(e.vendor ?? "")}</td></tr>`
          )
          .join("");
        return `<p><strong>Range:</strong> ${rangeLabel} · Total: ${escAttr(formatAmount(expensesRangeTotal))}</p>
          ${h("By category")}<table><tr><th>Category</th><th class="n">Total</th></tr>${cat}</table>
          ${h("Recent")}<table><tr><th>Date</th><th>Category</th><th class="n">Amount</th><th>Vendor</th></tr>${recent}</table>`;
      }
      case "pnl": {
        const rows = plByMonth
          .map((m) => {
            const profit = m.revenue - m.expenses - m.payroll;
            const margin = m.revenue > 0 ? (profit / m.revenue) * 100 : 0;
            return `<tr><td>${escAttr(m.label)}</td><td class="n">${escAttr(formatAmount(m.revenue))}</td><td class="n">${escAttr(formatAmount(m.expenses))}</td><td class="n">${escAttr(formatAmount(m.payroll))}</td><td class="n">${escAttr(formatAmount(m.payrollBase))}</td><td class="n">${escAttr(formatAmount(m.payrollCommission))}</td><td class="n">${escAttr(formatAmount(m.payrollBonus))}</td><td class="n">${escAttr(formatAmount(profit))}</td><td class="n">${margin.toFixed(1)}%</td></tr>`;
          })
          .join("");
        return `<p>YTD ${plCalendarYear}</p>${h("P&L by month")}<table><tr><th>Month</th><th class="n">Revenue</th><th class="n">Expenses</th><th class="n">Payroll net</th><th class="n">Pay base</th><th class="n">Pay comm.</th><th class="n">Pay bonus</th><th class="n">Profit</th><th class="n">Margin</th></tr>${rows}</table>`;
      }
      case "annual_tax": {
        return ""; // uses dedicated printAnnualTaxPack
      }
      default:
        return `<p>No printable summary.</p>`;
    }
  }

  function handleExportCsv() {
    setExportOpen(false);
    const name = `barberpro-${exportFileSlug}`;
    switch (activeTab) {
      case "revenue": {
        const col = revenueStats.breakdownGranularity === "month" ? "Month" : "Date";
        downloadCsv(
          name,
          [col, "Transactions", "Revenue_RM"],
          revenueStats.breakdown.map((r) => {
            const label =
              revenueStats.breakdownGranularity === "month"
                ? new Date(r.date + "-01T12:00:00").toLocaleString("en-MY", { month: "short", year: "numeric" })
                : r.date;
            return [label, r.count, r.total.toFixed(2)];
          })
        );
        break;
      }
      case "staff":
        downloadCsv(
          name,
          [
            "Name",
            "Role",
            "Branch",
            "Attributed_revenue_RM",
            "Commission_est_RM",
            "Transactions",
            "Line_qty",
            "Avg_per_tx_RM",
          ],
          staffPerformance.map((s) => [
            s.full_name,
            s.role ?? "",
            s.branchLabel,
            s.attributedRevenue.toFixed(2),
            s.commissionEarned.toFixed(2),
            s.transactionCount,
            s.lineItemQty,
            s.avgPerTx.toFixed(2),
          ])
        );
        break;
      case "attendance":
        downloadCsv(
          name,
          [
            "Staff",
            "Present",
            "Late",
            "Half_day",
            "Absent",
            "Leave",
            "Days_logged",
            "On_time_rate_pct",
          ],
          (attendanceSummariesResult?.data ?? []).map((row) => {
            const denom = row.daysPresent + row.daysLate + row.daysHalfDay + row.daysAbsent + row.daysLeave;
            const worked = row.daysPresent + row.daysLate + row.daysHalfDay;
            const rate = denom > 0 ? ((worked / denom) * 100).toFixed(1) : "";
            return [
              row.staffName,
              row.daysPresent,
              row.daysLate,
              row.daysHalfDay,
              row.daysAbsent,
              row.daysLeave,
              row.totalRecords,
              rate,
            ];
          })
        );
        break;
      case "customers":
        downloadCsv(
          name,
          ["Name", "Phone", "Visits", "Spend_RM", "Last_visit"],
          customerSpend.map((c) => [
            c.name,
            c.phone,
            c.visits,
            c.spend.toFixed(2),
            c.lastAt.split("T")[0] ?? "",
          ])
        );
        break;
      case "inventory": {
        const list = lowStockItems.length > 0 ? lowStockItems : inventoryItems.slice(0, 500);
        downloadCsv(
          name,
          ["Item", "Stock", "Reorder_level", "Unit_cost_RM", "Sell_price_RM"],
          list.map((i) => [
            i.name,
            i.stock_qty ?? 0,
            i.reorder_level ?? 0,
            (i.unit_cost ?? 0).toFixed(2),
            (i.sell_price ?? 0).toFixed(2),
          ])
        );
        break;
      }
      case "expenses":
        downloadCsv(
          name,
          ["Category", "Total_RM"],
          expensesByCategory.map((r) => [r.category, r.total.toFixed(2)])
        );
        break;
      case "pnl":
        downloadCsv(
          name,
          [
            "Month",
            "Revenue_RM",
            "Expenses_RM",
            "Payroll_net_RM",
            "Payroll_base_RM",
            "Payroll_commission_RM",
            "Payroll_bonus_RM",
            "Gross_profit_RM",
            "Margin_pct",
          ],
          plByMonth.map((m) => {
            const profit = m.revenue - m.expenses - m.payroll;
            const margin = m.revenue > 0 ? (profit / m.revenue) * 100 : 0;
            return [
              m.label,
              m.revenue.toFixed(2),
              m.expenses.toFixed(2),
              m.payroll.toFixed(2),
              m.payrollBase.toFixed(2),
              m.payrollCommission.toFixed(2),
              m.payrollBonus.toFixed(2),
              profit.toFixed(2),
              margin.toFixed(2),
            ];
          })
        );
        break;
      case "annual_tax":
        downloadCsv(
          `barberpro-annual-tax-${taxYear}`,
          ["Field", "Amount_RM"],
          [
            ["Gross receipts", annualTaxData.grossRevenue.toFixed(2)],
            ["SST recorded", annualTaxData.taxCollected.toFixed(2)],
            ["Expenses", annualTaxData.expenseTotal.toFixed(2)],
            ["Net business income", annualTaxData.summary.netBusinessIncome.toFixed(2)],
            ["Chargeable income (est.)", annualTaxData.summary.chargeableIncome.toFixed(2)],
            ["Estimated tax", annualTaxData.summary.estimatedTax.toFixed(2)],
          ]
        );
        break;
      default:
        break;
    }
  }

  function handleExportPdf() {
    setExportOpen(false);
    if (activeTab === "annual_tax") {
      printAnnualTaxPack();
      return;
    }
    const body = buildCurrentTabPdfBody();
    const html = `
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#111;max-width:900px;margin:0 auto}
h1{font-size:20px;margin-bottom:4px} h2{font-size:14px;margin-top:20px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
.n{text-align:right;font-variant-numeric:tabular-nums}
.muted{font-size:11px;color:#666;margin-top:16px}
</style>
<h1>${escAttr(tenantName)} — ${escAttr(TABS.find((x) => x.id === activeTab)?.label ?? "Report")}</h1>
<p class="muted">Generated ${escAttr(new Date().toLocaleString("en-MY"))} · ${escAttr(periodLabelStr)}</p>
${body}
<p class="muted">BarberPro export for records only. Use official figures for tax filing.</p>`;
    openPrintableDocument(html, `report-${exportFileSlug}`);
  }

  const isLoading =
    transactionsLoading ||
    staffLoading ||
    customersLoading ||
    inventoryLoading ||
    expensesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t.reports.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.reports.subtitle}</p>
        </div>
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40"
          >
            <Download className="h-4 w-4" /> {t.reports.export}
            <ChevronDown className={`h-4 w-4 transition ${exportOpen ? "rotate-180" : ""}`} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 z-50 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-white/10 bg-[#222] py-1 shadow-xl">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
              >
                <FileText className="h-4 w-4 text-emerald-400" />
                Download CSV
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
              >
                <FileText className="h-4 w-4 text-[#D4AF37]" />
                Print / Save PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-white/5 bg-[#1a1a1a] p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const locked = isStarter && PRO_ONLY_TABS.has(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !locked && setActiveTab(tab.id)}
              title={locked ? "Professional plan required" : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                locked
                  ? "cursor-not-allowed text-gray-600"
                  : activeTab === tab.id
                  ? "bg-[#2a2a2a] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Pro-only tab upgrade prompt */}
      {isStarter && PRO_ONLY_TABS.has(activeTab) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
            <Lock className="h-7 w-7 text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-bold text-white">Professional Plan Required</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            This report tab is available on the{" "}
            <span className="font-semibold text-white">Professional plan</span>. Upgrade to unlock P&amp;L,
            Attendance, and Annual Tax reports.
          </p>
          <Link
            href="/settings?tab=billing"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            Upgrade to Professional — RM 249/mo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {activeTab !== "annual_tax" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Period</span>
            {(() => {
              const now = new Date();
              const cy = now.getFullYear();
              const cm = now.getMonth();
              const lastMonthStart = new Date(cy, cm - 1, 1);
              const presets: { id: string; label: string; active: boolean; onClick: () => void }[] = [
                {
                  id: "this_month",
                  label: "This month",
                  active:
                    periodScope === "month" &&
                    periodYear === cy &&
                    periodMonthIndex === cm,
                  onClick: () => {
                    setPeriodScope("month");
                    setPeriodYear(cy);
                    setPeriodMonthIndex(cm);
                  },
                },
                {
                  id: "last_month",
                  label: "Last month",
                  active:
                    periodScope === "month" &&
                    periodYear === lastMonthStart.getFullYear() &&
                    periodMonthIndex === lastMonthStart.getMonth(),
                  onClick: () => {
                    setPeriodScope("month");
                    setPeriodYear(lastMonthStart.getFullYear());
                    setPeriodMonthIndex(lastMonthStart.getMonth());
                  },
                },
                {
                  id: "last_30",
                  label: "Last 30 days",
                  active: periodScope === "rolling_30",
                  onClick: () => setPeriodScope("rolling_30"),
                },
                {
                  id: "this_year",
                  label: "This year",
                  active: periodScope === "year" && periodYear === cy,
                  onClick: () => {
                    setPeriodScope("year");
                    setPeriodYear(cy);
                  },
                },
                {
                  id: "all",
                  label: "All loaded data",
                  active: periodScope === "all",
                  onClick: () => setPeriodScope("all"),
                },
              ];
              return presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={p.onClick}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    p.active
                      ? "bg-[#D4AF37]/20 text-[#D4AF37] ring-1 ring-[#D4AF37]/40"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ));
            })()}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Month</span>
              <select
                value={periodMonthIndex}
                disabled={periodScope === "year" || periodScope === "rolling_30" || periodScope === "all"}
                onChange={(e) => {
                  setPeriodMonthIndex(Number(e.target.value));
                  setPeriodScope("month");
                }}
                className="min-w-[140px] rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.v} value={m.v}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Year</span>
              <select
                value={periodYear}
                disabled={periodScope === "rolling_30" || periodScope === "all"}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setPeriodYear(y);
                  if (periodScope === "rolling_30" || periodScope === "all") setPeriodScope("month");
                }}
                className="min-w-[96px] rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-[#1a1a1a] text-[#D4AF37] focus:ring-[#D4AF37]/40"
                checked={periodScope === "year"}
                disabled={periodScope === "rolling_30" || periodScope === "all"}
                onChange={(e) => {
                  if (e.target.checked) setPeriodScope("year");
                  else setPeriodScope("month");
                }}
              />
              <span>Whole calendar year</span>
            </label>
          </div>
        </div>
      )}

      {/* Revenue tab */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total revenue</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{formatAmount(revenueStats.totalRevenue)}</h3>
              {revenueStats.vsPriorPct != null && priorTx.length > 0 && (
                <p className={`mt-1 text-xs font-medium ${revenueStats.vsPriorPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {revenueStats.vsPriorPct >= 0 ? "↑" : "↓"} {Math.abs(revenueStats.vsPriorPct).toFixed(1)}% vs prior period
                </p>
              )}
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Subtotal / SST</p>
              <h3 className="mt-2 text-lg font-bold text-white">{formatAmount(revenueStats.totalSubtotal)}</h3>
              <p className="mt-1 text-sm text-[#D4AF37]">SST {formatAmount(revenueStats.totalTax)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Transactions</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{revenueStats.count}</h3>
              <p className="mt-1 text-xs text-gray-500">Avg {formatAmount(revenueStats.avg)} / ticket</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Service vs product</p>
              <p className="mt-2 text-sm text-emerald-400">Services {formatAmount(revenueStats.serviceRevenue)}</p>
              <p className="text-sm text-blue-400">Products {formatAmount(revenueStats.productRevenue)}</p>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <RevenueTrendChart data={revenueTrendChartData} />
            </div>
            <div className="min-w-0">
              <PaymentMixChart data={paymentMixChartData} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ServiceProductDonut
              service={revenueStats.serviceRevenue}
              product={revenueStats.productRevenue}
            />
            <TopServicesBarChart
              data={revenueStats.topServices.map(({ name, revenue }) => ({ name, revenue }))}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="border-b border-white/5 px-5 py-4">
                <h3 className="font-bold text-white">Payment methods</h3>
                <p className="mt-0.5 text-xs text-gray-500">{periodLabelStr}</p>
              </div>
              {revenueStats.paymentRows.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">No data</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <th className="p-4 text-left">Method</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueStats.paymentRows.map((row) => (
                        <tr key={row.method} className="border-t border-white/[0.04]">
                          <td className="p-4 text-white">{humanizePaymentMethod(row.method)}</td>
                          <td className="p-4 text-right text-[#D4AF37]">{formatAmount(row.amount)}</td>
                          <td className="p-4 text-right text-gray-400">{row.pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            <Card>
              <div className="border-b border-white/5 px-5 py-4">
                <h3 className="font-bold text-white">Top services</h3>
                <p className="mt-0.5 text-xs text-gray-500">By line revenue</p>
              </div>
              {revenueStats.topServices.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">No service lines</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <th className="p-4 text-left">Service</th>
                        <th className="p-4 text-right">Qty</th>
                        <th className="p-4 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueStats.topServices.map((row) => (
                        <tr key={row.name} className="border-t border-white/[0.04]">
                          <td className="p-4 font-medium text-white">{row.name}</td>
                          <td className="p-4 text-right text-gray-300">{row.qty}</td>
                          <td className="p-4 text-right font-semibold text-emerald-400">{formatAmount(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">
                {revenueStats.breakdownGranularity === "month" ? "Monthly breakdown" : "Daily breakdown"}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">{periodLabelStr}</p>
            </div>
            {revenueStats.breakdown.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No data for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">
                        {revenueStats.breakdownGranularity === "month" ? "Month" : "Date"}
                      </th>
                      <th className="p-4 text-left">Transactions</th>
                      <th className="p-4 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueStats.breakdown.map((row) => (
                      <tr key={row.date} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">
                          {revenueStats.breakdownGranularity === "month"
                            ? new Date(`${row.date}-01T12:00:00`).toLocaleString("en-MY", {
                                month: "short",
                                year: "numeric",
                              })
                            : formatDate(`${row.date}T12:00:00`)}
                        </td>
                        <td className="p-4 text-gray-300">{row.count}</td>
                        <td className="p-4 font-bold text-[#D4AF37]">{formatAmount(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Staff Performance tab */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Team size</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{staffMembers.length}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Barbers</p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {staffMembers.filter((s) => /barber/i.test(s.role ?? "")).length}
              </h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Attributed revenue</p>
              <h3 className="mt-2 text-2xl font-bold text-[#D4AF37]">
                {formatAmount(staffPerformance.reduce((s, x) => s + x.attributedRevenue, 0))}
              </h3>
              <p className="mt-1 text-xs text-gray-500">{periodLabelStr}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Commission (estimate)</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-400">
                {formatAmount(staffPerformance.reduce((s, x) => s + x.commissionEarned, 0))}
              </h3>
              <p className="mt-1 text-xs text-gray-500">Schemes × POS/queue · {periodLabelStr}</p>
            </Card>
          </div>
          <StaffRevenueBarChart data={staffChartData} />
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Performance by staff</h3>
              <p className="mt-0.5 text-sm text-gray-500">
                Revenue from line items linked to each barber (POS / queue). Quick payments with staff attribution included.
              </p>
            </div>
            {staffMembers.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No staff yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Role</th>
                      <th className="p-4 text-left">Branch</th>
                      <th className="p-4 text-right">Revenue</th>
                      <th className="p-4 text-right">Comm. (est.)</th>
                      <th className="p-4 text-right">Tx</th>
                      <th className="p-4 text-right">Avg / tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformance.map((s) => (
                      <tr key={s.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">{s.full_name}</td>
                        <td className="p-4 text-gray-300">{s.role}</td>
                        <td className="p-4 text-gray-400">{s.branchLabel}</td>
                        <td className="p-4 text-right font-semibold text-[#D4AF37]">{formatAmount(s.attributedRevenue)}</td>
                        <td className="p-4 text-right font-semibold text-emerald-400">{formatAmount(s.commissionEarned)}</td>
                        <td className="p-4 text-right text-gray-300">{s.transactionCount}</td>
                        <td className="p-4 text-right text-gray-400">{formatAmount(s.avgPerTx)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-bold text-white">Attendance by staff</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Range: {reportAttRange.start} – {reportAttRange.end} (follows report period filter; &quot;All data&quot; uses last 30
              days).
            </p>
          </Card>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-4 text-left">Staff</th>
                    <th className="p-4 text-right">Present</th>
                    <th className="p-4 text-right">Late</th>
                    <th className="p-4 text-right">Half day</th>
                    <th className="p-4 text-right">Absent</th>
                    <th className="p-4 text-right">Leave</th>
                    <th className="p-4 text-right">Days logged</th>
                    <th className="p-4 text-right">On-time rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(attendanceSummariesResult?.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No attendance records in this range. Record attendance from Payroll.
                      </td>
                    </tr>
                  ) : (
                    (attendanceSummariesResult?.data ?? []).map((row) => {
                      const denom = row.daysPresent + row.daysLate + row.daysHalfDay + row.daysAbsent + row.daysLeave;
                      const worked = row.daysPresent + row.daysLate + row.daysHalfDay;
                      const rate = denom > 0 ? (worked / denom) * 100 : 0;
                      return (
                        <tr key={row.staffId} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="p-4 font-medium text-white">{row.staffName}</td>
                          <td className="p-4 text-right text-emerald-400">{row.daysPresent}</td>
                          <td className="p-4 text-right text-yellow-400">{row.daysLate}</td>
                          <td className="p-4 text-right text-gray-300">{row.daysHalfDay}</td>
                          <td className="p-4 text-right text-red-400">{row.daysAbsent}</td>
                          <td className="p-4 text-right text-gray-400">{row.daysLeave}</td>
                          <td className="p-4 text-right text-gray-300">{row.totalRecords}</td>
                          <td className="p-4 text-right text-[#D4AF37]">{rate.toFixed(0)}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Customers tab */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total customers</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{customerStats.total}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">New this month</p>
              <h3 className="mt-2 text-2xl font-bold text-[#D4AF37]">{customerStats.newThisMonth}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Spend in period</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-400">
                {formatAmount(customerSpend.reduce((s, c) => s + c.spend, 0))}
              </h3>
              <p className="mt-1 text-xs text-gray-500">{periodLabelStr}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active buyers</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{customerSpend.length}</h3>
              <p className="mt-1 text-xs text-gray-500">With ≥1 paid visit</p>
            </Card>
          </div>
          <CustomerSpendBarChart
            data={customerSpend.map((c) => ({ name: c.name, spend: c.spend }))}
          />
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Top customers by spend</h3>
              <p className="mt-0.5 text-sm text-gray-500">{periodLabelStr}</p>
            </div>
            {customerSpend.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                No customer-linked transactions this period. Walk-ins without a customer record won&apos;t appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Phone</th>
                      <th className="p-4 text-right">Visits</th>
                      <th className="p-4 text-right">Spend</th>
                      <th className="p-4 text-left">Last visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSpend.map((c) => (
                      <tr key={c.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">{c.name}</td>
                        <td className="p-4 text-gray-300">{c.phone || "—"}</td>
                        <td className="p-4 text-right text-gray-300">{c.visits}</td>
                        <td className="p-4 text-right font-semibold text-[#D4AF37]">{formatAmount(c.spend)}</td>
                        <td className="p-4 text-gray-500">{formatDate(c.lastAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Recently joined</h3>
            </div>
            {customers.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No customers yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Phone</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.slice(0, 20).map((c) => (
                      <tr key={c.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">{c.full_name}</td>
                        <td className="p-4 text-gray-300">{c.phone ?? "—"}</td>
                        <td className="p-4 text-gray-300">{c.email ?? "—"}</td>
                        <td className="p-4 text-gray-500">{formatDate(c.created_at + "T12:00:00")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Inventory tab */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">SKU count</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{inventoryStats.totalItems}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Low stock</p>
              <h3 className="mt-2 text-2xl font-bold text-red-400">{inventoryStats.lowStock}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Stock value (cost)</p>
              <h3 className="mt-2 text-xl font-bold text-gray-200">{formatAmount(inventoryValuation.cost)}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Retail value</p>
              <h3 className="mt-2 text-xl font-bold text-[#D4AF37]">{formatAmount(inventoryValuation.retail)}</h3>
            </Card>
          </div>
          <InventoryValueChart cost={inventoryValuation.cost} retail={inventoryValuation.retail} />
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Low stock alerts</h3>
              <p className="mt-0.5 text-xs text-gray-500">Stock at or below reorder level</p>
            </div>
            {lowStockItems.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                No low stock items
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Item</th>
                      <th className="p-4 text-left">Stock</th>
                      <th className="p-4 text-left">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="p-4 font-medium text-white">{item.name}</td>
                        <td className="p-4 text-red-400">{item.stock_qty ?? 0}</td>
                        <td className="p-4 text-gray-300">{item.reorder_level ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Expenses tab */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">All time (approved)</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{formatAmount(expenseStats.total)}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">This month</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{formatAmount(expenseStats.thisMonth)}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Selected period</p>
              <h3 className="mt-2 text-2xl font-bold text-orange-400">{formatAmount(expensesRangeTotal)}</h3>
              <p className="mt-1 text-xs text-gray-500">{periodLabelStr}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Records in period</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{expensesInRange.length}</h3>
            </Card>
          </div>
          <ExpenseCategoryChart data={expensesByCategory} />
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">By category</h3>
              <p className="mt-0.5 text-xs text-gray-500">{periodLabelStr}</p>
            </div>
            {expensesByCategory.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No expenses in this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Category</th>
                      <th className="p-4 text-right">Total</th>
                      <th className="p-4 text-right">% of period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesByCategory.map((row) => (
                      <tr key={row.category} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">{row.category}</td>
                        <td className="p-4 text-right font-bold text-white">{formatAmount(row.total)}</td>
                        <td className="p-4 text-right text-gray-400">
                          {expensesRangeTotal > 0 ? ((row.total / expensesRangeTotal) * 100).toFixed(1) : "0"}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Recent entries</h3>
              <p className="mt-0.5 text-xs text-gray-500">Latest in selected period (up to 40)</p>
            </div>
            {expensesInRange.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">No entries</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Category</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-left">Vendor</th>
                      <th className="p-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...expensesInRange]
                      .sort((a, b) => {
                        const da = new Date((a.expense_date ?? a.created_at).includes("T") ? (a.expense_date ?? a.created_at) : `${a.expense_date ?? a.created_at}T12:00:00`);
                        const db = new Date((b.expense_date ?? b.created_at).includes("T") ? (b.expense_date ?? b.created_at) : `${b.expense_date ?? b.created_at}T12:00:00`);
                        return db.getTime() - da.getTime();
                      })
                      .slice(0, 40)
                      .map((e) => {
                        const raw = e.expense_date ?? e.created_at;
                        const d = raw?.includes("T") ? raw : `${raw}T12:00:00`;
                        return (
                          <tr key={e.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="p-4 text-gray-300">{formatDate(d)}</td>
                            <td className="p-4 font-medium text-white">{e.category}</td>
                            <td className="p-4 text-right text-[#D4AF37]">{formatAmount(e.amount ?? 0)}</td>
                            <td className="p-4 text-gray-400">{e.vendor ?? "—"}</td>
                            <td className="p-4 text-gray-500">{e.status}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* P&L tab */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Revenue (YTD)</p>
              <h3 className="mt-2 text-xl font-bold text-white">{formatAmount(plTotals.revenue)}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Expenses (YTD)</p>
              <h3 className="mt-2 text-xl font-bold text-red-400">{formatAmount(plTotals.expenses)}</h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payroll net (YTD)</p>
              <h3 className="mt-2 text-xl font-bold text-orange-400">{formatAmount(plTotals.payroll)}</h3>
            </Card>
            <Card className={`p-5 ${plTotals.grossProfit >= 0 ? "border-emerald-500/20" : "border-red-500/20"}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gross profit (YTD)</p>
              <h3 className={`mt-2 text-xl font-bold ${plTotals.grossProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatAmount(plTotals.grossProfit)}
              </h3>
              <p className="mt-1 text-xs text-gray-500">Margin: {plTotals.margin.toFixed(1)}%</p>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="mb-3 font-bold text-white">Payroll breakdown (YTD)</h3>
            <p className="mb-3 text-xs text-gray-500">
              By month of payroll entry creation. Net payout = base + commissions + bonuses − deductions − advances.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span className="text-gray-400">Base salaries</span>
                <span className="font-semibold text-white">{formatAmount(plTotals.payrollBase)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span className="text-gray-400">Commissions</span>
                <span className="font-semibold text-emerald-400">{formatAmount(plTotals.payrollCommission)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span className="text-gray-400">Bonuses</span>
                <span className="font-semibold text-[#D4AF37]">{formatAmount(plTotals.payrollBonus)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span className="text-gray-400">Net payroll</span>
                <span className="font-semibold text-orange-400">{formatAmount(plTotals.payroll)}</span>
              </div>
            </div>
          </Card>

          <PlTrendChart data={plChartData} />

          <Card>
            <div className="border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Monthly breakdown ({new Date().getFullYear()})</h3>
              <p className="mt-0.5 text-xs text-gray-500">Revenue − expenses − net payroll = gross profit</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-4 text-left">Month</th>
                    <th className="p-4 text-right">Revenue</th>
                    <th className="p-4 text-right">Expenses</th>
                    <th className="p-4 text-right">Payroll net</th>
                    <th className="p-4 text-right">Pay base</th>
                    <th className="p-4 text-right">Pay comm.</th>
                    <th className="p-4 text-right">Pay bonus</th>
                    <th className="p-4 text-right">Gross profit</th>
                    <th className="p-4 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {plByMonth.map((m) => {
                    const profit = m.revenue - m.expenses - m.payroll;
                    const margin = m.revenue > 0 ? (profit / m.revenue) * 100 : 0;
                    return (
                      <tr key={m.label} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">{m.label}</td>
                        <td className="p-4 text-right text-[#D4AF37]">{formatAmount(m.revenue)}</td>
                        <td className="p-4 text-right text-red-400">{formatAmount(m.expenses)}</td>
                        <td className="p-4 text-right text-orange-400">{formatAmount(m.payroll)}</td>
                        <td className="p-4 text-right text-gray-400">{formatAmount(m.payrollBase)}</td>
                        <td className="p-4 text-right text-emerald-400/90">{formatAmount(m.payrollCommission)}</td>
                        <td className="p-4 text-right text-[#D4AF37]/80">{formatAmount(m.payrollBonus)}</td>
                        <td className={`p-4 text-right font-semibold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatAmount(profit)}</td>
                        <td className={`p-4 text-right text-sm ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-gray-600">Payroll figures are from payroll entries created this year. Expenses only count records for this year.</p>
          </Card>
        </div>
      )}

      {/* Annual tax (Malaysia) — working paper for Form B / records */}
      {activeTab === "annual_tax" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Calendar year (data scope)</label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
              >
                {[0, 1, 2, 3, 4].map((y) => {
                  const yr = new Date().getFullYear() - y;
                  return (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              type="button"
              onClick={printAnnualTaxPack}
              className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Download PDF (print)
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Gross receipts ({taxYear})
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                {formatAmount(annualTaxData.grossRevenue)}
              </h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                SST recorded on sales
              </p>
              <h3 className="mt-2 text-xl font-bold text-[#D4AF37]">
                {formatAmount(annualTaxData.taxCollected)}
              </h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Expenses ({taxYear})
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                {formatAmount(annualTaxData.expenseTotal)}
              </h3>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Est. income tax (YA {taxYear})
              </p>
              <h3 className="mt-2 text-xl font-bold text-emerald-400">
                {formatAmount(annualTaxData.summary.estimatedTax)}
              </h3>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AnnualTaxSummaryChart
              grossRevenue={annualTaxData.grossRevenue}
              expenses={annualTaxData.expenseTotal}
              netIncome={annualTaxData.summary.netBusinessIncome}
            />
            <EmployerStatutoryBar
              epf={employerStatutoryForYear.epf}
              socso={employerStatutoryForYear.socso}
              eis={employerStatutoryForYear.eis}
            />
          </div>

          <Card className="p-5">
            <h3 className="font-bold text-white">Simplified chargeable income (self-employed style)</h3>
            <p className="mt-1 text-sm text-gray-500">
              Net business income in app: receipts minus expenses. Chargeable income applies personal relief only
              (RM {PERSONAL_RELIEF.toLocaleString("en-MY")}); add other reliefs in MyTax.
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-white/5 py-2">
                <dt className="text-gray-400">Net business income</dt>
                <dd className="font-medium text-white">{formatAmount(annualTaxData.summary.netBusinessIncome)}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <dt className="text-gray-400">Less: personal relief (placeholder)</dt>
                <dd className="font-medium text-white">{formatAmount(annualTaxData.summary.personalRelief)}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <dt className="text-gray-400">Chargeable income (estimate)</dt>
                <dd className="font-bold text-[#D4AF37]">{formatAmount(annualTaxData.summary.chargeableIncome)}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <dt className="text-gray-400">Monthly instalment hint (÷12)</dt>
                <dd className="font-medium text-white">{formatAmount(annualTaxData.summary.monthlyInstalment)}</dd>
              </div>
            </dl>
          </Card>

          {/* Employer statutory obligations */}
          <Card className="p-5">
            <h3 className="font-bold text-white">Employer statutory obligations ({taxYear} estimate)</h3>
            <p className="mt-1 mb-4 text-xs text-gray-500">Aggregated from payroll entries created in {taxYear}. Verify with KWSP / PERKESO portals before payment.</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-white/5 py-2">
                <dt className="text-gray-400">EPF employer contributions</dt>
                <dd className="font-medium text-white">{formatAmount(employerStatutoryForYear.epf)}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <dt className="text-gray-400">SOCSO employer contributions</dt>
                <dd className="font-medium text-white">{formatAmount(employerStatutoryForYear.socso)}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <dt className="text-gray-400">EIS employer contributions</dt>
                <dd className="font-medium text-white">{formatAmount(employerStatutoryForYear.eis)}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2 font-bold">
                <dt className="text-white">Total employer cost (gross + levies)</dt>
                <dd className="text-orange-400">{formatAmount(employerStatutoryForYear.totalCost)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-gray-600">EPF: submit via <a href="https://i-akaun.kwsp.gov.my" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline">i-Akaun KWSP</a>. SOCSO/EIS: <a href="https://assist.perkeso.gov.my" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline">ASSIST PERKESO</a>.</p>
          </Card>

          {/* Filing calendar */}
          <Card className="p-5">
            <h3 className="mb-3 font-bold text-white">Filing deadlines (YA {taxYear})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-3 text-left">Obligation</th>
                    <th className="p-3 text-left">Deadline</th>
                    <th className="p-3 text-left hidden sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filingDeadlines.map((d) => (
                    <tr key={d.label} className="border-t border-white/[0.04]">
                      <td className="p-3 font-medium text-white">{d.label}</td>
                      <td className="p-3 text-[#D4AF37] whitespace-nowrap">{d.date}</td>
                      <td className="p-3 text-gray-400 text-xs hidden sm:table-cell">{d.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-bold text-white">Resident tax bands (reference)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-3 text-left">Chargeable income</th>
                    <th className="p-3 text-left">Marginal rate</th>
                  </tr>
                </thead>
                <tbody>
                  {TAX_BRACKETS_DISPLAY.map((row) => (
                    <tr key={row.range} className="border-t border-white/[0.04]">
                      <td className="p-3 text-gray-300">{row.range}</td>
                      <td className="p-3 text-white">{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              File annual returns via{" "}
              <a
                href="https://mytax.hasil.gov.my"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] underline hover:no-underline"
              >
                MyTax (LHDN)
              </a>
              . SST and e-invoice rules are administered separately (RMCD / LHDN). This app does not submit to
              government systems; keep source documents and engage a tax agent where required.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
