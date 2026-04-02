"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

const AnnouncementSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  message: z.string().min(1).max(2000).trim(),
  type: z.enum(["info", "warning", "critical"]),
  target: z.string().min(1),
});

export async function sendAnnouncement(formData: FormData) {
  const role = await requireAccess("/announcements");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const parsed = AnnouncementSchema.safeParse({
    title: formData.get("title"),
    message: formData.get("message"),
    type: formData.get("type"),
    target: formData.get("target"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let senderEmail = "unknown";
  try {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    senderEmail = user?.email ?? "unknown";
  } catch { /* noop */ }

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("announcements").insert({
    title: parsed.data.title,
    message: parsed.data.message,
    type: parsed.data.type,
    target: parsed.data.target,
    sent_by: senderEmail,
    sent_at: new Date().toISOString(),
  }) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({
    action: "announcement.send",
    metadata: { title: parsed.data.title, type: parsed.data.type, target: parsed.data.target },
  });

  revalidatePath("/announcements");
  return { success: true };
}
