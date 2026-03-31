import type { SupabaseClient } from "@supabase/supabase-js";

export type BranchPickRow = { id: string; is_hq: boolean };

/**
 * From an already-loaded active branch list: optional UI/request choice,
 * then the user's assigned branch, then HQ, then first branch.
 */
export function pickEffectiveBranchId(
  branchList: BranchPickRow[],
  appUserBranchId: string | null,
  requestedBranchId?: string | null
): string | null {
  if (branchList.length === 0) return null;
  if (requestedBranchId && branchList.some((b) => b.id === requestedBranchId)) {
    return requestedBranchId;
  }
  if (appUserBranchId && branchList.some((b) => b.id === appUserBranchId)) {
    return appUserBranchId;
  }
  const hq = branchList.find((b) => b.is_hq);
  return hq?.id ?? branchList[0]!.id;
}

/** Loads active branches for the tenant, then applies pickEffectiveBranchId. */
export async function resolveEffectiveBranchId(
  supabase: SupabaseClient,
  tenantId: string,
  appUserBranchId: string | null,
  requestedBranchId?: string | null
): Promise<string | null> {
  const { data: branches } = await supabase
    .from("branches")
    .select("id, is_hq")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("is_hq", { ascending: false });

  return pickEffectiveBranchId(branches ?? [], appUserBranchId, requestedBranchId);
}
