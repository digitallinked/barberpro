"use server";

import { revalidatePath } from "next/cache";

import type { Json } from "@/types/database.types";
import { getAuthContext } from "./_helpers";

export async function updateTenantProfile(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = (formData.get("name") as string) || undefined;
    const email = (formData.get("email") as string) || undefined;
    const phone = (formData.get("phone") as string) || undefined;
    const address_line1 = (formData.get("address_line1") as string) || undefined;
    const city = (formData.get("city") as string) || undefined;
    const postcode = (formData.get("postcode") as string) || undefined;
    const state = (formData.get("state") as string) || undefined;
    const registration_number = (formData.get("registration_number") as string) || undefined;

    const updateData: Record<string, string | undefined> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address_line1 !== undefined) updateData.address_line1 = address_line1;
    if (city !== undefined) updateData.city = city;
    if (postcode !== undefined) updateData.postcode = postcode;
    if (state !== undefined) updateData.state = state;
    if (registration_number !== undefined) updateData.registration_number = registration_number;

    const { error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateBranchHours(branchId: string, hours: Record<string, unknown>) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("branches")
      .update({
        operating_hours: hours as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", branchId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function changePassword(formData: FormData) {
  try {
    const { supabase } = await getAuthContext();

    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
