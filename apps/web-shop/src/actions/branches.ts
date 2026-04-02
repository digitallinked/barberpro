"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

export async function createBranch(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const phone = (formData.get("phone") as string) || null;
    const email = (formData.get("email") as string) || null;
    const address = (formData.get("address") as string) || null;
    const operating_hours = formData.get("operating_hours");
    const is_hq = formData.get("is_hq") === "true" || formData.get("is_hq") === "1";

    if (!name || !code) {
      return { success: false, error: "Name and code are required" };
    }

    const hours = operating_hours
      ? (typeof operating_hours === "string" ? JSON.parse(operating_hours) : operating_hours)
      : {};

    const { error } = await supabase.from("branches").insert({
      tenant_id: tenantId,
      name,
      code,
      phone: phone || null,
      email: email || null,
      address: address || null,
      operating_hours: hours,
      is_hq,
      checkin_token: randomUUID(),
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

    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const phone = (formData.get("phone") as string) || null;
    const email = (formData.get("email") as string) || null;
    const address = (formData.get("address") as string) || null;
    const operating_hours = formData.get("operating_hours");
    const is_hq = formData.get("is_hq") === "true" || formData.get("is_hq") === "1";

    if (!name || !code) {
      return { success: false, error: "Name and code are required" };
    }

    const updateData: Record<string, unknown> = {
      name,
      code,
      phone: phone || null,
      email: email || null,
      address: address || null,
      is_hq,
      updated_at: new Date().toISOString(),
    };

    if (operating_hours !== undefined && operating_hours !== null) {
      updateData.operating_hours =
        typeof operating_hours === "string" ? JSON.parse(operating_hours) : operating_hours;
    }

    const { error } = await supabase
      .from("branches")
      .update(updateData)
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
