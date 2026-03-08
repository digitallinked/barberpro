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
      transaction_items (id, name, item_type, quantity, unit_price, line_total)
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
  branchId?: string
): Promise<{ data: DashboardStats | null; error: Error | null }> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const query = client
    .from("transactions")
    .select("id, total_amount, customer_id")
    .eq("tenant_id", tenantId)
    .gte("created_at", startOfToday.toISOString())
    .lte("created_at", endOfToday.toISOString());

  const { data: todayTransactions, error: todayError } = branchId
    ? await query.eq("branch_id", branchId)
    : await query;

  if (todayError) {
    return { data: null, error: new Error(todayError.message) };
  }

  const transactions = todayTransactions ?? [];
  const todayRevenue = transactions.reduce(
    (sum: number, t: { total_amount?: number }) => sum + (t.total_amount ?? 0),
    0
  );
  const todayCustomers = new Set(
    transactions.map((t: { customer_id?: string | null }) => t.customer_id).filter(Boolean)
  ).size;
  const totalTransactions = transactions.length;

  return {
    data: {
      todayRevenue,
      todayCustomers,
      totalTransactions,
    },
    error: null,
  };
}
