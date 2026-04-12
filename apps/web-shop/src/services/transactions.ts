import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type TransactionWithItems = {
  id: string;
  branch_id: string;
  customer_id: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { full_name: string; phone: string } | null;
  transaction_items: Array<{
    id: string;
    name: string;
    item_type: string;
    service_id: string | null;
    inventory_item_id: string | null;
    staff_id: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

export type DashboardStats = {
  todayRevenue: number;
  todayCustomers: number;
  totalTransactions: number;
};

export type DailyRevenue = {
  label: string;
  revenue: number;
};

export type Period = "today" | "week" | "month";

const MY_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

function getMalaysiaDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  // Shift to Malaysia local time using UTC fields
  const myNow = new Date(now.getTime() + MY_OFFSET_MS);
  const myStartOfDay = new Date(
    Date.UTC(myNow.getUTCFullYear(), myNow.getUTCMonth(), myNow.getUTCDate())
  );
  // Convert MY midnight back to UTC
  const startOfTodayUTC = new Date(myStartOfDay.getTime() - MY_OFFSET_MS);
  const endOfTodayUTC = new Date(startOfTodayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  if (period === "today") {
    return { start: startOfTodayUTC, end: endOfTodayUTC };
  }

  if (period === "week") {
    const dayOfWeek = myStartOfDay.getUTCDay(); // 0 = Sun
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeekUTC = new Date(
      startOfTodayUTC.getTime() - daysFromMonday * 24 * 60 * 60 * 1000
    );
    return { start: startOfWeekUTC, end: endOfTodayUTC };
  }

  // month
  const myStartOfMonth = new Date(
    Date.UTC(myNow.getUTCFullYear(), myNow.getUTCMonth(), 1)
  );
  const startOfMonthUTC = new Date(myStartOfMonth.getTime() - MY_OFFSET_MS);
  return { start: startOfMonthUTC, end: endOfTodayUTC };
}

export async function getTransactions(
  client: Client,
  tenantId: string,
  branchId?: string,
  limit = 50
): Promise<{ data: TransactionWithItems[] | null; error: Error | null }> {
  let query = client
    .from("transactions")
    .select(
      `
      id,
      branch_id,
      customer_id,
      payment_method,
      payment_status,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      paid_at,
      created_at,
      updated_at,
      customers (full_name, phone),
      transaction_items (id, name, item_type, service_id, inventory_item_id, staff_id, quantity, unit_price, line_total)
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const transactions: TransactionWithItems[] = (data ?? []).map((row: Record<string, unknown>) => {
    const customer = row.customers as Record<string, unknown> | null;
    const items = (row.transaction_items ?? []) as Array<Record<string, unknown>>;

    return {
      id: row.id as string,
      branch_id: row.branch_id as string,
      customer_id: row.customer_id as string | null,
      payment_method: row.payment_method as string,
      payment_status: row.payment_status as string,
      subtotal: row.subtotal as number,
      tax_amount: row.tax_amount as number,
      discount_amount: row.discount_amount as number,
      total_amount: row.total_amount as number,
      paid_at: row.paid_at as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      customer: customer
        ? { full_name: customer.full_name as string, phone: customer.phone as string }
        : null,
      transaction_items: items.map((item) => ({
        id: item.id as string,
        name: item.name as string,
        item_type: item.item_type as string,
        service_id: (item.service_id as string | null) ?? null,
        inventory_item_id: (item.inventory_item_id as string | null) ?? null,
        staff_id: (item.staff_id as string | null) ?? null,
        quantity: item.quantity as number,
        unit_price: item.unit_price as number,
        line_total: item.line_total as number,
      })),
    };
  });

  return { data: transactions, error: null };
}

export async function getDashboardStats(
  client: Client,
  tenantId: string,
  branchId?: string,
  period: Period = "today"
): Promise<{ data: DashboardStats | null; error: Error | null }> {
  const { start, end } = getMalaysiaDateRange(period);

  const { data, error } = await client.rpc("report_revenue_summary", {
    p_tenant_id: tenantId,
    p_branch_id: branchId ?? null,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: {
      todayRevenue: Number(row?.total_revenue ?? 0),
      todayCustomers: Number(row?.total_customers ?? 0),
      totalTransactions: Number(row?.total_transactions ?? 0),
    },
    error: null,
  };
}

export async function getDailyRevenue(
  client: Client,
  tenantId: string,
  branchId?: string,
  period: Period = "today"
): Promise<{ data: DailyRevenue[] | null; error: Error | null }> {
  const { start, end } = getMalaysiaDateRange(period);

  const { data: rpcData, error } = await client.rpc("report_daily_revenue", {
    p_tenant_id: tenantId,
    p_branch_id: branchId ?? null,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  // Build a map from the SQL result (day_label → revenue)
  const dayMap: Record<string, number> = {};
  for (const row of rpcData ?? []) {
    dayMap[row.day_label] = Number(row.revenue ?? 0);
  }

  const now = new Date();
  const myNow = new Date(now.getTime() + MY_OFFSET_MS);
  const result: DailyRevenue[] = [];

  if (period === "today" || period === "week") {
    const myStartOfDay = new Date(
      Date.UTC(myNow.getUTCFullYear(), myNow.getUTCMonth(), myNow.getUTCDate())
    );
    const dayOfWeek = myStartOfDay.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(myStartOfDay.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dayKey = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
      result.push({ label: dayLabels[i], revenue: dayMap[dayKey] ?? 0 });
    }
  } else {
    const year = myNow.getUTCFullYear();
    const month = myNow.getUTCMonth();
    const today = myNow.getUTCDate();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    for (let d = 1; d <= Math.min(daysInMonth, today); d++) {
      const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ label: String(d), revenue: dayMap[dayKey] ?? 0 });
    }
  }

  return { data: result, error: null };
}
