"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit-log";

const UpdateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export async function updatePlatformSetting(formData: FormData) {
  const role = await requireAccess("/settings");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const parsed = UpdateSettingSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
  });

  if (!parsed.success) return { error: "Invalid input." };

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("platform_settings")
    .update({ value: parsed.data.value, updated_at: new Date().toISOString() })
    .eq("key", parsed.data.key) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({
    action: "settings.update",
    metadata: { key: parsed.data.key, value: parsed.data.value },
  });

  revalidatePath("/settings");
  return { success: true };
}
