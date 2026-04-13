import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { malaysiaDateString } from "../lib/malaysia-date";

export type QueueTicket = {
  id: string;
  queue_number: string;
  status: string;
  customer_id: string | null;
  service_id: string | null;
  assigned_staff_id: string | null;
  party_size: number;
  estimated_wait_min: number | null;
  called_at: string | null;
  created_at: string;
  customer: { full_name: string; phone: string } | null;
  service: { name: string; price: number } | null;
  assigned_staff: { full_name: string } | null;
};

export function useQueueTickets(tenantId: string, branchId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!branchId) return;

    const queueDay = malaysiaDateString();
    const channel = supabase
      .channel(`queue-staff-${branchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tickets",
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["queue-tickets", tenantId, branchId, queueDay] });
          queryClient.invalidateQueries({ queryKey: ["queue-count", tenantId, branchId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, tenantId, queryClient]);

  return useQuery({
    queryKey: ["queue-tickets", tenantId, branchId, malaysiaDateString()],
    queryFn: async () => {
      const queueDay = malaysiaDateString();

      const { data, error } = await supabase
        .from("queue_tickets")
        .select(
          `id, queue_number, status, customer_id, service_id, assigned_staff_id,
           party_size, estimated_wait_min, called_at, created_at,
           customers (full_name, phone),
           services (name, price),
           staff_profiles!queue_tickets_assigned_staff_id_fkey (app_users (full_name))`
        )
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .eq("queue_day", queueDay)
        .in("status", ["waiting", "in_service"])
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);

      return (data ?? []).map((row: Record<string, unknown>) => {
        const customer = row.customers as Record<string, unknown> | null;
        const service = row.services as Record<string, unknown> | null;
        const staffProfile = row.staff_profiles as Record<string, unknown> | null;
        const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
        const staffData = Array.isArray(appUser) ? appUser[0] : appUser;

        return {
          id: row.id as string,
          queue_number: row.queue_number as string,
          status: row.status as string,
          customer_id: row.customer_id as string | null,
          service_id: row.service_id as string | null,
          assigned_staff_id: row.assigned_staff_id as string | null,
          party_size: (row.party_size as number) ?? 1,
          estimated_wait_min: row.estimated_wait_min as number | null,
          called_at: row.called_at as string | null,
          created_at: row.created_at as string,
          customer: customer
            ? { full_name: customer.full_name as string, phone: customer.phone as string }
            : null,
          service: service
            ? { name: service.name as string, price: Number(service.price ?? 0) }
            : null,
          assigned_staff: staffData
            ? { full_name: (staffData as Record<string, unknown>).full_name as string }
            : null,
        } satisfies QueueTicket;
      });
    },
    enabled: !!tenantId && !!branchId,
    refetchInterval: 15_000,
  });
}

export function useQueueActions(tenantId: string, branchId: string) {
  const queryClient = useQueryClient();

  function invalidate() {
    const queueDay = malaysiaDateString();
    queryClient.invalidateQueries({ queryKey: ["queue-tickets", tenantId, branchId, queueDay] });
    queryClient.invalidateQueries({ queryKey: ["queue-count", tenantId, branchId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  const updateStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "in_service") updates.called_at = new Date().toISOString();
      if (status === "completed") updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from("queue_tickets")
        .update(updates)
        .eq("id", ticketId)
        .eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const addWalkIn = useMutation({
    mutationFn: async ({
      customerName,
      serviceId,
      partySize,
    }: {
      customerName: string;
      serviceId: string | null;
      partySize: number;
    }) => {
      const queueDay = malaysiaDateString();

      const { count } = await supabase
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", branchId)
        .eq("queue_day", queueDay);

      const queueNumber = String((count ?? 0) + 1).padStart(3, "0");

      const { error } = await supabase.from("queue_tickets").insert({
        tenant_id: tenantId,
        branch_id: branchId,
        queue_number: queueNumber,
        queue_day: queueDay,
        status: "waiting",
        service_id: serviceId,
        party_size: partySize,
        source: "staff_mobile",
        ...(customerName ? { notes: customerName } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { updateStatus, addWalkIn };
}
