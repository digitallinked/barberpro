"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

export async function createService(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;
    const duration_min = Number(formData.get("duration_min")) || 0;
    const price = Number(formData.get("price")) || 0;
    const category_id = (formData.get("category_id") as string) || null;

    if (!name) {
      return { success: false, error: "Name is required" };
    }

    const { error } = await supabase.from("services").insert({
      tenant_id: tenantId,
      name,
      duration_min,
      price,
      category_id: category_id || null,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateService(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;
    const duration_min = Number(formData.get("duration_min")) || 0;
    const price = Number(formData.get("price")) || 0;
    const category_id = (formData.get("category_id") as string) || null;

    if (!name) {
      return { success: false, error: "Name is required" };
    }

    const { error } = await supabase
      .from("services")
      .update({
        name,
        duration_min,
        price,
        category_id: category_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteService(id: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("services")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createServiceCategory(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;

    if (!name) {
      return { success: false, error: "Name is required" };
    }

    const { error } = await supabase.from("service_categories").insert({
      tenant_id: tenantId,
      name,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateServiceCategory(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;

    if (!name) {
      return { success: false, error: "Name is required" };
    }

    const { error } = await supabase
      .from("service_categories")
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
