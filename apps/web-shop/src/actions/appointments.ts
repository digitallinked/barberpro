"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

export async function createAppointment(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const customer_id = formData.get("customer_id") as string;
    const service_id = formData.get("service_id") as string;
    const barber_staff_id = (formData.get("barber_staff_id") as string) || null;
    const branch_id = formData.get("branch_id") as string;
    const start_at = formData.get("start_at") as string;
    const end_at = (formData.get("end_at") as string) || null;
    const source = (formData.get("source") as string) || "manual";
    const notes = (formData.get("notes") as string) || null;

    if (!customer_id || !service_id || !branch_id || !start_at) {
      return { success: false, error: "Customer, service, branch, and start time are required" };
    }

    const { error } = await supabase.from("appointments").insert({
      tenant_id: tenantId,
      customer_id,
      service_id,
      barber_staff_id: barber_staff_id || null,
      branch_id,
      start_at,
      end_at: end_at || null,
      source,
      notes: notes || null,
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

    const customer_id = formData.get("customer_id") as string;
    const service_id = formData.get("service_id") as string;
    const barber_staff_id = (formData.get("barber_staff_id") as string) || null;
    const branch_id = formData.get("branch_id") as string;
    const start_at = formData.get("start_at") as string;
    const end_at = (formData.get("end_at") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    if (!customer_id || !service_id || !branch_id || !start_at) {
      return { success: false, error: "Customer, service, branch, and start time are required" };
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        customer_id,
        service_id,
        barber_staff_id: barber_staff_id || null,
        branch_id,
        start_at,
        end_at: end_at || null,
        notes: notes || null,
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

    const { error } = await supabase
      .from("appointments")
      .update({
        status,
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
