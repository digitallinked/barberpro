import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getMalaysiaDateRange, type Period } from "../lib/malaysia-date";

export type StaffEarning = {
  staffId: string;
  staffName: string;
  totalRevenue: number;
  transactionCount: number;
};

export function useMyEarnings(
  tenantId: string,
  branchId: string,
  appUserId: string,
  period: Period
) {
  return useQuery({
    queryKey: ["my-earnings", tenantId, branchId, appUserId, period],
    queryFn: async () => {
      const { start, end } = getMalaysiaDateRange(period);

      const { data, error } = await supabase
        .from("transaction_items")
        .select(
          `id, unit_price, quantity, line_total,
           transactions!inner (id, created_at, tenant_id, branch_id, total_amount, customer_id)`
        )
        .eq("staff_id", appUserId)
        .eq("transactions.tenant_id", tenantId)
        .eq("transactions.branch_id", branchId)
        .gte("transactions.created_at", start.toISOString())
        .lte("transactions.created_at", end.toISOString());

      if (error) throw new Error(error.message);

      const items = data ?? [];
      const totalRevenue = items.reduce((sum, item) => sum + (item.line_total ?? 0), 0);
      const uniqueTxns = new Set(items.map((i) => (i.transactions as unknown as Record<string, unknown>)?.id)).size;

      return { totalRevenue, serviceCount: items.length, transactionCount: uniqueTxns, items };
    },
    enabled: !!tenantId && !!branchId && !!appUserId,
  });
}

export function useAllStaffEarnings(tenantId: string, branchId: string, period: Period) {
  return useQuery({
    queryKey: ["all-staff-earnings", tenantId, branchId, period],
    queryFn: async () => {
      const { start, end } = getMalaysiaDateRange(period);

      const { data, error } = await supabase
        .from("transaction_items")
        .select(
          `staff_id, line_total,
           transactions!inner (created_at, tenant_id, branch_id),
           staff_profiles!transaction_items_staff_id_fkey (app_users (full_name))`
        )
        .eq("transactions.tenant_id", tenantId)
        .eq("transactions.branch_id", branchId)
        .gte("transactions.created_at", start.toISOString())
        .lte("transactions.created_at", end.toISOString())
        .not("staff_id", "is", null);

      if (error) throw new Error(error.message);

      const map = new Map<string, StaffEarning>();
      for (const row of data ?? []) {
        const staffId = row.staff_id as string | null;
        if (!staffId) continue;
        const staffProfile = (row.staff_profiles as unknown) as Record<string, unknown> | null;
        const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
        const staffData = Array.isArray(appUser) ? appUser[0] : appUser;
        const staffName = (staffData as Record<string, unknown>)?.full_name as string ?? "Staff";

        const existing = map.get(staffId);
        if (existing) {
          existing.totalRevenue += row.line_total ?? 0;
          existing.transactionCount += 1;
        } else {
          map.set(staffId, {
            staffId,
            staffName,
            totalRevenue: row.line_total ?? 0,
            transactionCount: 1,
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
    enabled: !!tenantId && !!branchId,
  });
}
