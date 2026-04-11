"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

export async function createCustomer(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const full_name = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    const email = (formData.get("email") as string) || null;
    const date_of_birth = (formData.get("date_of_birth") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    if (!full_name || !phone) {
      return { success: false, error: "Full name and phone are required" };
    }

    const { error } = await supabase.from("customers").insert({
      tenant_id: tenantId,
      full_name,
      phone,
      email: email || null,
      date_of_birth: date_of_birth || null,
      notes: notes || null,
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

    const full_name = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    const email = (formData.get("email") as string) || null;
    const date_of_birth = (formData.get("date_of_birth") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    if (!full_name || !phone) {
      return { success: false, error: "Full name and phone are required" };
    }

    const { error } = await supabase
      .from("customers")
      .update({
        full_name,
        phone,
        email: email || null,
        date_of_birth: date_of_birth || null,
        notes: notes || null,
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
