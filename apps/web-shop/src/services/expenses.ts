import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type ExpenseRow = Tables<"expenses">;

export async function getExpenses(
  client: Client,
  tenantId: string,
  branchId?: string | null,
): Promise<{ data: ExpenseRow[] | null; error: Error | null }> {
  let query = client
    .from("expenses")
    .select("id, amount, category, expense_date, payment_method, status, vendor, branch_id, supplier_id, notes, receipt_url, created_by, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;
  return {
    data: data as ExpenseRow[] | null,
    error: error ? new Error(error.message) : null,
  };
}

export async function getExpenseStats(
  client: Client,
  tenantId: string,
  branchId?: string | null
): Promise<{
  data: { total: number; thisMonth: number } | null;
  error: Error | null;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]!;
  const today = now.toISOString().split("T")[0]!;

  const { data, error } = await client.rpc("report_expense_totals", {
    p_tenant_id: tenantId,
    p_branch_id: (branchId ?? null) as string,
    p_start: startOfMonth,
    p_end: today,
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: {
      total: Number(row?.total ?? 0),
      thisMonth: Number(row?.this_month ?? 0),
    },
    error: null,
  };
}
