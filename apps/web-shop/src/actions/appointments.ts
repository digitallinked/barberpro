"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { appointmentSchema, appointmentStatusSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createAppointment(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = appointmentSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { customer_id, service_id, barber_staff_id, branch_id, start_at, end_at, source, notes } = parsed.data;

    const { error } = await supabase.from("appointments").insert({
      tenant_id: tenantId,
      customer_id,
      service_id,
      barber_staff_id,
      branch_id,
      start_at,
      end_at,
      source,
      notes,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/appointments", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateAppointment(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = appointmentSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { customer_id, service_id, barber_staff_id, branch_id, start_at, end_at, notes } = parsed.data;

    const { error } = await supabase
      .from("appointments")
      .update({
        customer_id,
        service_id,
        barber_staff_id,
        branch_id,
        start_at,
        end_at,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/appointments", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateAppointmentStatus(id: string, status: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const statusParsed = appointmentStatusSchema.safeParse(status);
    if (!statusParsed.success) {
      return { success: false, error: statusParsed.error.issues[0].message };
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: statusParsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/appointments", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
