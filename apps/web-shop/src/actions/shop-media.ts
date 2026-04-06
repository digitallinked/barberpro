"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

function mediaPathBelongsToTenant(path: string | null | undefined, tenantId: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.includes("..") || path.startsWith("/")) return false;
  const first = path.split("/").filter(Boolean)[0];
  return first === tenantId;
}

/** Save (or replace) the tenant logo. storagePath must be under <tenantId>/logo/. */
export async function saveTenantLogo(storagePath: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    if (!mediaPathBelongsToTenant(storagePath, tenantId)) {
      return { success: false, error: "Invalid storage path" };
    }

    const { error } = await supabase
      .from("tenants")
      .update({ logo_url: storagePath, updated_at: new Date().toISOString() })
      .eq("id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Remove tenant logo (set to null). */
export async function removeTenantLogo() {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("tenants")
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq("id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Add a shop gallery image. storagePath must be under <tenantId>/images/. */
export async function addTenantImage(storagePath: string, sortOrder: number) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    if (!mediaPathBelongsToTenant(storagePath, tenantId)) {
      return { success: false, error: "Invalid storage path" };
    }

    const { data, error } = await supabase
      .from("tenant_images")
      .insert({ tenant_id: tenantId, storage_path: storagePath, sort_order: sortOrder })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, id: data.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Delete a gallery image by id. */
export async function deleteTenantImage(imageId: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("tenant_images")
      .delete()
      .eq("id", imageId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Update sort_order for multiple images at once. */
export async function reorderTenantImages(orderedIds: string[]) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const updates = orderedIds.map((id, idx) =>
      supabase
        .from("tenant_images")
        .update({ sort_order: idx })
        .eq("id", id)
        .eq("tenant_id", tenantId)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) return { success: false, error: failed.error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
