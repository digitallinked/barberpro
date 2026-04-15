"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/services/transactions";

const MY_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

function getMalaysiaDateRange(period: "today" | "week" | "month"): { start: string; end: string } {
  const now = new Date();
  const myNow = new Date(now.getTime() + MY_OFFSET_MS);
  const myStartOfDay = new Date(
    Date.UTC(myNow.getUTCFullYear(), myNow.getUTCMonth(), myNow.getUTCDate())
  );
  const startOfTodayUTC = new Date(myStartOfDay.getTime() - MY_OFFSET_MS);
  const endOfTodayUTC = new Date(startOfTodayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  if (period === "today") {
    return { start: startOfTodayUTC.toISOString(), end: endOfTodayUTC.toISOString() };
  }
  if (period === "week") {
    const dow = myStartOfDay.getUTCDay();
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    const startOfWeekUTC = new Date(startOfTodayUTC.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
    return { start: startOfWeekUTC.toISOString(), end: endOfTodayUTC.toISOString() };
  }
  const myStartOfMonth = new Date(Date.UTC(myNow.getUTCFullYear(), myNow.getUTCMonth(), 1));
  const startOfMonthUTC = new Date(myStartOfMonth.getTime() - MY_OFFSET_MS);
  return { start: startOfMonthUTC.toISOString(), end: endOfTodayUTC.toISOString() };
}

/**
 * Server-cached dashboard stats. Revalidated via "dashboard-stats" tag after any
 * checkout or queue completion.
 */
export const getDashboardStatsServer = unstable_cache(
  async (tenantId: string, branchId: string | null, period: "today" | "week" | "month"): Promise<{ data: DashboardStats | null; error: string | null }> => {
    const supabase = await createClient();
    const { start, end } = getMalaysiaDateRange(period);

    let query = supabase
      .from("transactions")
      .select("total_amount, customer_id, payment_status, created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", start)
      .lte("created_at", end);

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };

    const paid = (data ?? []).filter((t) => t.payment_status === "paid");
    const todayRevenue = paid.reduce((s, t) => s + (t.total_amount ?? 0), 0);
    const uniqueCustomers = new Set(paid.map((t) => t.customer_id).filter(Boolean));

    return {
      data: {
        todayRevenue,
        todayCustomers: uniqueCustomers.size,
        totalTransactions: paid.length,
      },
      error: null,
    };
  },
  ["dashboard-stats"],
  {
    tags: ["dashboard-stats"],
    revalidate: 60, // 1 minute — live stats, short TTL
  }
);

/**
 * Server-cached branch list for a tenant.
 * Revalidated via "branches" tag after branch create/update/delete.
 */
export const getBranchesServer = unstable_cache(
  async (tenantId: string): Promise<{ data: Array<{ id: string; name: string; slug: string; is_hq: boolean }> | null; error: string | null }> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("branches")
      .select("id, name, slug, is_hq")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("is_hq", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },
  ["branches-server"],
  {
    tags: ["branches"],
    revalidate: 300, // 5 min — branch list changes rarely
  }
);
