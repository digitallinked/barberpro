"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { success: true } | { success: false; error: string };

export async function cancelAppointmentAction(
  appointmentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: customerAccount } = await (supabase as any)
      .from("customer_accounts")
      .select("email")
      .eq("auth_user_id", user.id)
      .maybeSingle() as { data: { email: string } | null };

    const userEmail = customerAccount?.email || user.email || "";

    const admin = createAdminClient();

    const { data: appt } = await admin
      .from("appointments")
      .select("id, status, customers(phone)")
      .eq("id", appointmentId)
      .maybeSingle();

    if (!appt) return { success: false, error: "Appointment not found" };

    const customerPhone = (appt.customers as { phone: string } | null)?.phone;
    if (customerPhone !== userEmail) {
      return { success: false, error: "Not authorised to cancel this appointment" };
    }

    if (appt.status !== "confirmed") {
      return { success: false, error: "Only confirmed appointments can be cancelled" };
    }

    const { error } = await admin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/bookings");
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
