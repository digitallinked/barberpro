"use server";

import { resolveAuthContext, type AuthContext } from "@barberpro/auth";

import { createClient } from "@/lib/supabase/server";

export type { AuthContext };

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  return resolveAuthContext(supabase);
}

/**
 * Returns auth context with branch ID enforcement.
 * Owners can access any branch; non-owners can only access their assigned branch.
 * Pass `requiredBranchId` to verify access to a specific branch.
 */
export async function getAuthContextWithBranch(
  requiredBranchId?: string
): Promise<AuthContext & { effectiveBranchId: string | null }> {
  const ctx = await getAuthContext();
  const { appUser } = ctx;

  if (appUser.role === "owner") {
    return { ...ctx, effectiveBranchId: requiredBranchId ?? appUser.branch_id };
  }

  // Non-owners: if a specific branch is requested, verify it matches their assignment
  if (requiredBranchId && appUser.branch_id && requiredBranchId !== appUser.branch_id) {
    throw new Error("Access denied: you can only access your assigned branch");
  }

  return { ...ctx, effectiveBranchId: appUser.branch_id };
}
