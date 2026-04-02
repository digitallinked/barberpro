import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type LogAdminActionArgs = {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Write a record to admin_audit_logs.
 * Non-fatal — errors are silently swallowed so they don't break the calling action.
 */
export async function logAdminAction({ action, targetType, targetId, metadata }: LogAdminActionArgs) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const actorEmail = user?.email ?? "unknown";

    const headersList = await headers();
    const role = headersList.get("x-admin-role") ?? "unknown";

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("admin_audit_logs").insert({
      action,
      actor_email: actorEmail,
      actor_role: role,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      metadata: metadata ?? null,
    });
  } catch {
    // non-fatal
  }
}
