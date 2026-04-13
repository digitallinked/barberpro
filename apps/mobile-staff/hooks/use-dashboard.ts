import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getMalaysiaDateRange, malaysiaDateString, type Period } from "../lib/malaysia-date";

export function useStaffProfileId(appUserId: string | undefined, tenantId: string) {
  return useQuery({
    queryKey: ["staff-profile-id", appUserId, tenantId],
    queryFn: async () => {
      if (!appUserId) return null;
      const { data } = await supabase
        .from("staff_profiles")
        .select("id")
        .eq("app_user_id", appUserId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      return data?.id ?? null;
    },
    enabled: !!appUserId && !!tenantId,
    staleTime: 10 * 60_000,
  });
}

export function useDashboardStats(tenantId: string, branchId: string, period: Period) {
  return useQuery({
    queryKey: ["dashboard-stats", tenantId, branchId, period],
    queryFn: async () => {
      const { start, end } = getMalaysiaDateRange(period);

      const { data, error } = await supabase
        .from("transactions")
        .select("id, total_amount, customer_id")
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (error) throw new Error(error.message);

      const transactions = data ?? [];
      const revenue = transactions.reduce((sum, t) => sum + (t.total_amount ?? 0), 0);
      const customers = new Set(transactions.map((t) => t.customer_id).filter(Boolean)).size;

      return {
        revenue,
        customers,
        transactions: transactions.length,
      };
    },
    enabled: !!tenantId && !!branchId,
    refetchInterval: 30_000,
  });
}

export function useQueueCount(tenantId: string, branchId: string) {
  return useQuery({
    queryKey: ["queue-count", tenantId, branchId],
    queryFn: async () => {
      const queueDay = malaysiaDateString();

      const { count: waiting } = await supabase
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .eq("status", "waiting")
        .eq("queue_day", queueDay);

      const { count: inService } = await supabase
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .eq("status", "in_service")
        .eq("queue_day", queueDay);

      return { waiting: waiting ?? 0, inService: inService ?? 0 };
    },
    enabled: !!tenantId && !!branchId,
    refetchInterval: 10_000,
  });
}

export function useClockInOut(tenantId: string, branchId: string, staffProfileId: string | null) {
  const queryClient = useQueryClient();

  const todayKey = malaysiaDateString();

  const todayRecord = useQuery({
    queryKey: ["attendance-today", staffProfileId, todayKey],
    queryFn: async () => {
      if (!staffProfileId) return null;
      const { data } = await supabase
        .from("staff_attendance")
        .select("id, clock_in, clock_out, status")
        .eq("tenant_id", tenantId)
        .eq("staff_id", staffProfileId)
        .eq("date", todayKey)
        .maybeSingle();
      return data;
    },
    enabled: !!staffProfileId,
  });

  const clockIn = useMutation({
    mutationFn: async () => {
      if (!staffProfileId) throw new Error("No staff profile");
      const now = new Date().toISOString();
      const { error } = await supabase.from("staff_attendance").upsert({
        tenant_id: tenantId,
        branch_id: branchId,
        staff_id: staffProfileId,
        date: todayKey,
        clock_in: now,
        status: "present",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today", staffProfileId, todayKey] });
    },
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      if (!staffProfileId || !todayRecord.data?.id) throw new Error("No attendance record");
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("staff_attendance")
        .update({ clock_out: now })
        .eq("id", todayRecord.data.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today", staffProfileId, todayKey] });
    },
  });

  return { todayRecord: todayRecord.data, clockIn, clockOut };
}
