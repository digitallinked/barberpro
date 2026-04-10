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
  tenantId: string
): Promise<{
  data: { total: number; thisMonth: number } | null;
  error: Error | null;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: allExpenses, error: allError } = await client
    .from("expenses")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("status", "approved");

  if (allError) {
    return { data: null, error: new Error(allError.message) };
  }

  const { data: monthExpenses, error: monthError } = await client
    .from("expenses")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .gte("expense_date", startOfMonth.toISOString().split("T")[0]!);

  if (monthError) {
    return { data: null, error: new Error(monthError.message) };
  }

  const total = (allExpenses ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const thisMonth = (monthExpenses ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return {
    data: { total, thisMonth },
    error: null,
  };
}
