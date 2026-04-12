"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { branchSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createBranch(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = branchSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, code, phone, email, address, operating_hours, is_hq, latitude, longitude } = parsed.data;

    const { error } = await supabase.from("branches").insert({
      tenant_id: tenantId,
      name,
      code,
      phone,
      email,
      address,
      operating_hours,
      is_hq,
      checkin_token: randomUUID(),
      latitude,
      longitude,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/branches");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateBranch(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = branchSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, code, phone, email, address, operating_hours, is_hq, latitude, longitude } = parsed.data;

    const { error } = await supabase
      .from("branches")
      .update({
        name,
        code,
        phone,
        email,
        address,
        operating_hours,
        is_hq,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/branches");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateBranchMode(
  id: string,
  acceptsOnlineBookings: boolean,
  acceptsWalkinQueue: boolean
) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("branches")
      .update({
        accepts_online_bookings: acceptsOnlineBookings,
        accepts_walkin_queue: acceptsWalkinQueue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/branches");
    revalidatePath(`/branches/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteBranch(id: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("branches")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/branches");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
