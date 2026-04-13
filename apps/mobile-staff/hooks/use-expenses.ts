import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type Expense = {
  id: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method: string | null;
  status: string;
  vendor: string | null;
  notes: string | null;
  created_at: string;
};

export function useExpenses(tenantId: string, branchId?: string | null) {
  return useQuery({
    queryKey: ["expenses", tenantId, branchId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select(
          "id, amount, category, expense_date, payment_method, status, vendor, notes, created_at"
        )
        .eq("tenant_id", tenantId)
        .order("expense_date", { ascending: false })
        .limit(50);

      if (branchId) query = query.eq("branch_id", branchId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Expense[];
    },
    enabled: !!tenantId,
  });
}

export function useExpenseActions(tenantId: string, branchId: string, appUserId: string) {
  const queryClient = useQueryClient();

  const createExpense = useMutation({
    mutationFn: async ({
      amount,
      category,
      expenseDate,
      vendor,
      notes,
      paymentMethod,
    }: {
      amount: number;
      category: string;
      expenseDate: string;
      vendor?: string;
      notes?: string;
      paymentMethod?: string;
    }) => {
      const { error } = await supabase.from("expenses").insert({
        tenant_id: tenantId,
        branch_id: branchId,
        amount,
        category,
        expense_date: expenseDate,
        vendor: vendor ?? null,
        notes: notes ?? null,
        payment_method: paymentMethod ?? null,
        status: "paid",
        created_by: appUserId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", tenantId] });
    },
  });

  return { createExpense };
}
