"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

export async function createQueueTicket(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const branch_id = formData.get("branch_id") as string;
    const customer_id = (formData.get("customer_id") as string) || null;
    const service_id = (formData.get("service_id") as string) || null;
    const preferred_staff_id = (formData.get("preferred_staff_id") as string) || null;

    if (!branch_id) {
      return { success: false, error: "Branch is required" };
    }

    const { count } = await supabase
      .from("queue_tickets")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("branch_id", branch_id);

    const queue_number = "Q" + String((count ?? 0) + 1).padStart(4, "0");

    const { error } = await supabase.from("queue_tickets").insert({
      tenant_id: tenantId,
      branch_id,
      customer_id: customer_id || null,
      service_id: service_id || null,
      preferred_staff_id: preferred_staff_id || null,
      queue_number,
      status: "waiting",
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/queue");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateQueueStatus(
  id: string,
  status: string,
  assignedStaffId?: string
) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (assignedStaffId !== undefined) {
      updateData.assigned_staff_id = assignedStaffId || null;
    }

    if (status === "in_service") {
      updateData.called_at = new Date().toISOString();
    }

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("queue_tickets")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/queue");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
