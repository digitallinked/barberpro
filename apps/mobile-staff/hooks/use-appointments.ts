import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type Appointment = {
  id: string;
  customer_id: string;
  service_id: string;
  branch_id: string;
  barber_staff_id: string | null;
  start_at: string;
  end_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  customer: { full_name: string; phone: string } | null;
  service: { name: string; duration_min: number; price: number } | null;
  barber: { full_name: string } | null;
};

export function useAppointments(
  tenantId: string,
  branchId: string,
  staffProfileId?: string | null
) {
  return useQuery({
    queryKey: ["appointments", tenantId, branchId, staffProfileId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(
          `id, customer_id, service_id, branch_id, barber_staff_id, start_at, end_at,
           status, notes, created_at,
           customers (full_name, phone),
           services (name, duration_min, price),
           staff_profiles!appointments_barber_staff_id_fkey (app_users!inner (full_name))`
        )
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .order("start_at", { ascending: false });

      if (staffProfileId) {
        query = query.eq("barber_staff_id", staffProfileId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return (data ?? []).map((row: Record<string, unknown>) => {
        const customer = row.customers as Record<string, unknown> | null;
        const service = row.services as Record<string, unknown> | null;
        const staffProfile = row.staff_profiles as Record<string, unknown> | null;
        const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
        const barberData = Array.isArray(appUser) ? appUser[0] : appUser;

        return {
          id: row.id as string,
          customer_id: row.customer_id as string,
          service_id: row.service_id as string,
          branch_id: row.branch_id as string,
          barber_staff_id: row.barber_staff_id as string | null,
          start_at: row.start_at as string,
          end_at: row.end_at as string | null,
          status: row.status as string,
          notes: row.notes as string | null,
          created_at: row.created_at as string,
          customer: customer
            ? { full_name: customer.full_name as string, phone: customer.phone as string }
            : null,
          service: service
            ? {
                name: service.name as string,
                duration_min: service.duration_min as number,
                price: Number(service.price ?? 0),
              }
            : null,
          barber: barberData
            ? { full_name: (barberData as Record<string, unknown>).full_name as string }
            : null,
        } satisfies Appointment;
      });
    },
    enabled: !!tenantId && !!branchId,
    refetchInterval: 30_000,
  });
}

export function useAppointmentActions(tenantId: string) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  }

  const updateStatus = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId)
        .eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { updateStatus };
}
