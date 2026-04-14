"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { serviceSchema, serviceCategorySchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createService(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = serviceSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, duration_min, price, category_id } = parsed.data;

    const { error } = await supabase.from("services").insert({
      tenant_id: tenantId,
      name,
      duration_min,
      price,
      category_id,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateService(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = serviceSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, duration_min, price, category_id } = parsed.data;

    const { error } = await supabase
      .from("services")
      .update({
        name,
        duration_min,
        price,
        category_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
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

    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createServiceCategory(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = serviceCategorySchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase.from("service_categories").insert({
      tenant_id: tenantId,
      name: parsed.data.name,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateServiceCategory(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = serviceCategorySchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase
      .from("service_categories")
      .update({
        name: parsed.data.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
