"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => v || null),
});

type UpdateProfileResult = { success: true } | { success: false; error: string };

export async function updateProfileAction(
  input: Record<string, unknown>
): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    const { full_name, phone } = parsed.data;

    const { error } = await (supabase as any)
      .from("customer_accounts")
      .update({ full_name, phone })
      .eq("auth_user_id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

type CancelResult = { success: true } | { success: false; error: string };

export async function cancelAppointmentAction(appointmentId: string): Promise<CancelResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: customer } = await (supabase as any)
      .from("customer_accounts")
      .select("email")
      .eq("auth_user_id", user.id)
      .maybeSingle() as { data: { email: string } | null };

    const userEmail = customer?.email || user.email || "";

    const admin = createAdminClient();

    // Verify this appointment belongs to the user before cancelling
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

    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
