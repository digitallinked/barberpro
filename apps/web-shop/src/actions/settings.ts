"use server";

import { revalidatePath } from "next/cache";

import type { Json } from "@/types/database.types";
import { getAuthContext } from "./_helpers";
import { tenantProfileSchema, changePasswordSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function updateTenantProfile(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = tenantProfileSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, email, phone, address_line1, city, postcode, state, registration_number } = parsed.data;

    const updateData: Record<string, string | null | undefined> = {
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

export async function updatePreferredLanguage(language: "ms" | "en") {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("tenants")
      .update({ preferred_language: language, updated_at: new Date().toISOString() })
      .eq("id", tenantId);

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

    const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
