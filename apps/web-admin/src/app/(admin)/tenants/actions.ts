"use server";

import { revalidatePath } from "next/cache";

import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit-log";

export async function suspendTenant(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Invalid input." };

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("tenants")
    .update({ status: "suspended" })
    .eq("id", id) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({ action: "tenant.suspend", targetType: "tenant", targetId: id });
  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  return { success: true };
}

export async function unsuspendTenant(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Invalid input." };

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("tenants")
    .update({ status: "active" })
    .eq("id", id) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({ action: "tenant.unsuspend", targetType: "tenant", targetId: id });
  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  return { success: true };
}
