"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { customerSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createCustomer(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = customerSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { full_name, phone, email, date_of_birth, notes } = parsed.data;

    const { error } = await supabase.from("customers").insert({
      tenant_id: tenantId,
      full_name,
      phone,
      email,
      date_of_birth,
      notes,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/customers", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = customerSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { full_name, phone, email, date_of_birth, notes } = parsed.data;

    const { error } = await supabase
      .from("customers")
      .update({
        full_name,
        phone,
        email,
        date_of_birth,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/customers", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/customers", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
