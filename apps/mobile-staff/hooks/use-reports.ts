import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getMalaysiaDateRange, type Period } from "../lib/malaysia-date";

const MY_OFFSET_MS = 8 * 60 * 60 * 1000;

export type DailyRevenue = { label: string; revenue: number };
export type TopService = { name: string; count: number; revenue: number };

export function useDailyRevenue(tenantId: string, branchId: string, period: Period) {
  return useQuery({
    queryKey: ["daily-revenue", tenantId, branchId, period],
    queryFn: async () => {
      const { start, end } = getMalaysiaDateRange(period);

      const { data, error } = await supabase
        .from("transactions")
        .select("created_at, total_amount")
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (error) throw new Error(error.message);

      const dayMap: Record<string, number> = {};
      for (const t of data ?? []) {
        const myDate = new Date(new Date(t.created_at).getTime() + MY_OFFSET_MS);
        const dayKey = `${myDate.getUTCFullYear()}-${String(myDate.getUTCMonth() + 1).padStart(2, "0")}-${String(myDate.getUTCDate()).padStart(2, "0")}`;
        dayMap[dayKey] = (dayMap[dayKey] ?? 0) + (t.total_amount ?? 0);
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
          result.push({ label: dayLabels[i]!, revenue: dayMap[dayKey] ?? 0 });
        }
      } else {
        const year = myNow.getUTCFullYear();
        const month = myNow.getUTCMonth();
        const today = myNow.getUTCDate();
        for (let d = 1; d <= today; d++) {
          const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          result.push({ label: String(d), revenue: dayMap[dayKey] ?? 0 });
        }
      }

      return result;
    },
    enabled: !!tenantId && !!branchId,
  });
}

export function useTopServices(tenantId: string, branchId: string, period: Period) {
  return useQuery({
    queryKey: ["top-services", tenantId, branchId, period],
    queryFn: async () => {
      const { start, end } = getMalaysiaDateRange(period);

      const { data, error } = await supabase
        .from("transaction_items")
        .select(
          `name, quantity, line_total,
           transactions!inner (created_at, tenant_id, branch_id)`
        )
        .eq("item_type", "service")
        .eq("transactions.tenant_id", tenantId)
        .eq("transactions.branch_id", branchId)
        .gte("transactions.created_at", start.toISOString())
        .lte("transactions.created_at", end.toISOString());

      if (error) throw new Error(error.message);

      const serviceMap = new Map<string, TopService>();
      for (const row of data ?? []) {
        const name = row.name;
        const existing = serviceMap.get(name);
        if (existing) {
          existing.count += row.quantity ?? 1;
          existing.revenue += row.line_total ?? 0;
        } else {
          serviceMap.set(name, { name, count: row.quantity ?? 1, revenue: row.line_total ?? 0 });
        }
      }

      return Array.from(serviceMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    },
    enabled: !!tenantId && !!branchId,
  });
}
