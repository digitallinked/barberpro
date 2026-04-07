"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

function branchMediaPathValid(path: string | null | undefined, tenantId: string, branchId: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.includes("..") || path.startsWith("/")) return false;
  const parts = path.split("/").filter(Boolean);
  // Expected: <tenantId>/branches/<branchId>/logo/<file> or <tenantId>/branches/<branchId>/images/<file>
  return parts[0] === tenantId && parts[1] === "branches" && parts[2] === branchId;
}

/** Save (or replace) a branch logo. storagePath must be under <tenantId>/branches/<branchId>/logo/. */
export async function saveBranchLogo(branchId: string, storagePath: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    if (!branchMediaPathValid(storagePath, tenantId, branchId)) {
      return { success: false, error: "Invalid storage path" };
    }

    const { error } = await supabase
      .from("branches")
      .update({ logo_url: storagePath, updated_at: new Date().toISOString() })
      .eq("id", branchId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/branches/${branchId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Remove branch logo (set to null). */
export async function removeBranchLogo(branchId: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("branches")
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq("id", branchId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/branches/${branchId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Add a branch gallery image. storagePath must be under <tenantId>/branches/<branchId>/images/. */
export async function addBranchImage(branchId: string, storagePath: string, sortOrder: number) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    if (!branchMediaPathValid(storagePath, tenantId, branchId)) {
      return { success: false, error: "Invalid storage path" };
    }

    const { data, error } = await supabase
      .from("branch_images")
      .insert({ branch_id: branchId, tenant_id: tenantId, storage_path: storagePath, sort_order: sortOrder })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/branches/${branchId}`);
    return { success: true, id: data.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Delete a branch gallery image by id. */
export async function deleteBranchImage(branchId: string, imageId: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("branch_images")
      .delete()
      .eq("id", imageId)
      .eq("branch_id", branchId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/branches/${branchId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
