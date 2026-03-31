"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type BookingInput = {
  tenantId: string;
  branchId: string;
  serviceId: string;
  staffId: string | null;
  date: string;
  time: string;
};

type BookingResult = { success: true } | { success: false; error: string };

export async function bookAppointmentAction(input: BookingInput): Promise<BookingResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = createAdminClient();

    // Find or create a CRM customer record for this user in the tenant
    let { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("phone", user.email ?? "")
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await admin
        .from("customers")
        .insert({
          tenant_id: input.tenantId,
          name: user.user_metadata?.full_name ?? user.email ?? "Online Customer",
          phone: user.email ?? "",
        })
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        return { success: false, error: "Failed to create customer record" };
      }
      customer = newCustomer;
    }

    const startAt = new Date(`${input.date}T${input.time}:00`).toISOString();

    const { error: bookingError } = await admin
      .from("appointments")
      .insert({
        tenant_id: input.tenantId,
        branch_id: input.branchId,
        service_id: input.serviceId,
        barber_staff_id: input.staffId,
        customer_id: customer.id,
        start_at: startAt,
        source: "online",
        status: "confirmed",
      });

    if (bookingError) {
      return { success: false, error: "Failed to create appointment" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
