"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ALL_ADMIN_ROLES, type AdminRole } from "@/constants/permissions";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit-log";

const AddStaffSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().min(1).max(100).trim(),
  role: z.enum(["super_admin", "accounts", "support", "reports_viewer"] as [AdminRole, ...AdminRole[]]),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminStaff(supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("admin_staff");
}

export async function addStaff(formData: FormData) {
  await requireAccess("/staff");

  const parsed = AddStaffSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  const supabase = createAdminClient();
  const { error } = await adminStaff(supabase)
    .insert({ email: parsed.data.email, name: parsed.data.name, role: parsed.data.role }) as { error: { code: string; message: string } | null };

  if (error) {
    if (error.code === "23505") {
      return { error: "A staff member with that email already exists." };
    }
    return { error: error.message };
  }

  await logAdminAction({ action: "staff.add", metadata: { email: parsed.data.email, role: parsed.data.role } });
  revalidatePath("/staff");
  return { success: true };
}

export async function updateStaffRole(formData: FormData) {
  await requireAccess("/staff");

  const id = formData.get("id") as string;
  const role = formData.get("role") as AdminRole;

  if (!id || !ALL_ADMIN_ROLES.includes(role)) {
    return { error: "Invalid input." };
  }

  const supabase = createAdminClient();
  const { error } = await adminStaff(supabase)
    .update({ role })
    .eq("id", id) as { error: { message: string } | null };

  if (error) return { error: error.message };

  revalidatePath("/staff");
  return { success: true };
}

export async function toggleStaffActive(formData: FormData) {
  await requireAccess("/staff");

  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  if (!id) return { error: "Invalid input." };

  const supabase = createAdminClient();
  const { error } = await adminStaff(supabase)
    .update({ is_active: !isActive })
    .eq("id", id) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({ action: "staff.toggle", targetId: id, metadata: { is_active: !isActive } });
  revalidatePath("/staff");
  return { success: true };
}
