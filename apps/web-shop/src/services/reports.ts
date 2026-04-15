import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

// ─── Revenue Detail ─────────────────────────────────────────────────────────

export type RevenueDetail = {
  totalRevenue: number;
  totalSubtotal: number;
  totalTax: number;
  totalDiscount: number;
  txCount: number;
  avgTicket: number;
  serviceRevenue: number;
  productRevenue: number;
};

export async function getRevenueDetail(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  start: string,
  end: string
): Promise<{ data: RevenueDetail | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_revenue_detail", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: start,
    p_end: end,
  });

  if (error) return { data: null, error: new Error(error.message) };

  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: {
      totalRevenue: Number(row?.total_revenue ?? 0),
      totalSubtotal: Number(row?.total_subtotal ?? 0),
      totalTax: Number(row?.total_tax ?? 0),
      totalDiscount: Number(row?.total_discount ?? 0),
      txCount: Number(row?.tx_count ?? 0),
      avgTicket: Number(row?.avg_ticket ?? 0),
      serviceRevenue: Number(row?.service_revenue ?? 0),
      productRevenue: Number(row?.product_revenue ?? 0),
    },
    error: null,
  };
}

// ─── Payment Mix ────────────────────────────────────────────────────────────

export type PaymentMixRow = {
  paymentMethod: string;
  amount: number;
  txCount: number;
};

export async function getPaymentMix(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  start: string,
  end: string
): Promise<{ data: PaymentMixRow[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_payment_mix", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: start,
    p_end: end,
  });

  if (error) return { data: null, error: new Error(error.message) };

  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      paymentMethod: row.payment_method as string,
      amount: Number(row.amount ?? 0),
      txCount: Number(row.tx_count ?? 0),
    })),
    error: null,
  };
}

// ─── Staff Performance ──────────────────────────────────────────────────────

export type StaffPerformanceRow = {
  staffId: string;
  serviceRevenue: number;
  productRevenue: number;
  totalRevenue: number;
  servicesCount: number;
  customersServed: number;
  txCount: number;
};

export async function getStaffPerformance(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  start: string,
  end: string
): Promise<{ data: StaffPerformanceRow[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_staff_performance", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: start,
    p_end: end,
  });

  if (error) return { data: null, error: new Error(error.message) };

  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      staffId: row.staff_id as string,
      serviceRevenue: Number(row.service_revenue ?? 0),
      productRevenue: Number(row.product_revenue ?? 0),
      totalRevenue: Number(row.total_revenue ?? 0),
      servicesCount: Number(row.services_count ?? 0),
      customersServed: Number(row.customers_served ?? 0),
      txCount: Number(row.tx_count ?? 0),
    })),
    error: null,
  };
}

// ─── Revenue Timeseries ─────────────────────────────────────────────────────

export type RevenueTimeseriesRow = {
  bucketLabel: string;
  revenue: number;
  txCount: number;
};

export async function getRevenueTimeseries(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  start: string,
  end: string,
  granularity: "hour" | "day" | "month" = "day"
): Promise<{ data: RevenueTimeseriesRow[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_revenue_timeseries", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: start,
    p_end: end,
    p_granularity: granularity,
  });

  if (error) return { data: null, error: new Error(error.message) };

  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      bucketLabel: row.bucket_label as string,
      revenue: Number(row.revenue ?? 0),
      txCount: Number(row.tx_count ?? 0),
    })),
    error: null,
  };
}

// ─── P&L Monthly ────────────────────────────────────────────────────────────

export type PnlMonthRow = {
  monthNum: number;
  monthLabel: string;
  revenue: number;
  expenses: number;
  payroll: number;
  grossProfit: number;
};

export async function getPnlMonthly(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  year: number
): Promise<{ data: PnlMonthRow[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_pnl_monthly", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_year: year,
  });

  if (error) return { data: null, error: new Error(error.message) };

  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      monthNum: Number(row.month_num ?? 0),
      monthLabel: row.month_label as string,
      revenue: Number(row.revenue ?? 0),
      expenses: Number(row.expenses ?? 0),
      payroll: Number(row.payroll ?? 0),
      grossProfit: Number(row.gross_profit ?? 0),
    })),
    error: null,
  };
}

// ─── Tax Collection ─────────────────────────────────────────────────────────

export type TaxCollectionSummary = {
  grossRevenue: number;
  totalSubtotal: number;
  totalTax: number;
  totalDiscount: number;
  txCount: number;
};

export async function getTaxCollection(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  start: string,
  end: string
): Promise<{ data: TaxCollectionSummary | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_tax_collection", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: start,
    p_end: end,
  });

  if (error) return { data: null, error: new Error(error.message) };

  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: {
      grossRevenue: Number(row?.gross_revenue ?? 0),
      totalSubtotal: Number(row?.total_subtotal ?? 0),
      totalTax: Number(row?.total_tax ?? 0),
      totalDiscount: Number(row?.total_discount ?? 0),
      txCount: Number(row?.tx_count ?? 0),
    },
    error: null,
  };
}

// ─── Customer Spend Ranking ─────────────────────────────────────────────────

export type CustomerSpendRow = {
  customerId: string;
  visitCount: number;
  totalSpend: number;
  lastVisit: string;
};

export async function getCustomerSpend(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  start: string,
  end: string,
  limit = 25
): Promise<{ data: CustomerSpendRow[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_customer_spend", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: start,
    p_end: end,
    p_limit: limit,
  });

  if (error) return { data: null, error: new Error(error.message) };

  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      customerId: row.customer_id as string,
      visitCount: Number(row.visit_count ?? 0),
      totalSpend: Number(row.total_spend ?? 0),
      lastVisit: row.last_visit as string,
    })),
    error: null,
  };
}

// ─── Expense Summary ────────────────────────────────────────────────────────

export type ExpenseSummaryRow = {
  category: string;
  totalAmount: number;
  expenseCount: number;
};

export async function getExpenseSummary(
  client: Client,
  tenantId: string,
  branchId: string | undefined,
  start: string,
  end: string
): Promise<{ data: ExpenseSummaryRow[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_expense_summary", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: start,
    p_end: end,
  });

  if (error) return { data: null, error: new Error(error.message) };

  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      category: row.category as string,
      totalAmount: Number(row.total_amount ?? 0),
      expenseCount: Number(row.expense_count ?? 0),
    })),
    error: null,
  };
}

// ─── Customer Stats (branch-aware) ──────────────────────────────────────────

export type CustomerStatsResult = {
  totalCustomers: number;
  newThisMonth: number;
};

export async function getCustomerStatsBranchAware(
  client: Client,
  tenantId: string,
  branchId?: string
): Promise<{ data: CustomerStatsResult | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_customer_stats", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
  });

  if (error) return { data: null, error: new Error(error.message) };

  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: {
      totalCustomers: Number(row?.total_customers ?? 0),
      newThisMonth: Number(row?.new_this_month ?? 0),
    },
    error: null,
  };
}

// ─── Payroll Summary ────────────────────────────────────────────────────────

export type PayrollSummaryRow = {
  monthLabel: string;
  totalBase: number;
  totalCommission: number;
  totalBonuses: number;
  totalDeductions: number;
  totalNetPayout: number;
  entryCount: number;
};

export async function getPayrollSummary(
  client: Client,
  tenantId: string,
  start: string,
  end: string
): Promise<{ data: PayrollSummaryRow[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("report_payroll_summary", {
    p_tenant_id: tenantId,
    p_start: start,
    p_end: end,
  });

  if (error) return { data: null, error: new Error(error.message) };

  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      monthLabel: row.month_label as string,
      totalBase: Number(row.total_base ?? 0),
      totalCommission: Number(row.total_commission ?? 0),
      totalBonuses: Number(row.total_bonuses ?? 0),
      totalDeductions: Number(row.total_deductions ?? 0),
      totalNetPayout: Number(row.total_net_payout ?? 0),
      entryCount: Number(row.entry_count ?? 0),
    })),
    error: null,
  };
}
