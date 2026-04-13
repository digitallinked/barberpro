import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  loyalty_points: number | null;
  notes: string | null;
  created_at: string;
};

export function useCustomers(tenantId: string, branchId: string, search?: string) {
  return useQuery({
    queryKey: ["customers", tenantId, branchId, search ?? ""],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select("id, full_name, phone, email, loyalty_points, notes, created_at")
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (search && search.trim().length > 0) {
        query = query.or(
          `full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Customer[];
    },
    enabled: !!tenantId && !!branchId,
  });
}

export function useCustomerTransactions(customerId: string, tenantId: string) {
  return useQuery({
    queryKey: ["customer-transactions", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `id, total_amount, payment_method, created_at,
           transaction_items (id, name, quantity, unit_price, line_total)`
        )
        .eq("customer_id", customerId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!customerId && !!tenantId,
  });
}
