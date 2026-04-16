import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateNotificationInput, NotificationRow } from "./types";

/**
 * Inserts one notification row. Returns the created row.
 * Call this with a service-role admin client so it bypasses RLS.
 * Supabase Realtime delivers the row to the recipient's live session automatically.
 */
export async function createNotification(
  adminClient: SupabaseClient,
  input: CreateNotificationInput
): Promise<NotificationRow | null> {
  const { data, error } = await adminClient
    .from("notifications")
    .insert({
      auth_user_id: input.authUserId,
      tenant_id: input.tenantId ?? null,
      title: input.title,
      body: input.body,
      category: input.category,
      action_url: input.actionUrl ?? null,
      data: input.data ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[notifications] createNotification failed:", error.message);
    return null;
  }

  return data as NotificationRow;
}

/**
 * Marks one or more notifications as read.
 * Uses the user's own session client (RLS applies).
 */
export async function markNotificationsRead(
  sessionClient: SupabaseClient,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  await sessionClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", ids);
}

/**
 * Marks all unread notifications as read for the current user.
 */
export async function markAllNotificationsRead(
  sessionClient: SupabaseClient
): Promise<void> {
  await sessionClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("is_read", false);
}
