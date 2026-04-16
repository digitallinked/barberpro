"use server";

import {
  createNotification,
  configureVapid,
  sendPushToUser,
  type CreateNotificationInput,
  type PushPayload,
} from "@barberpro/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidConfigured = false;

function ensureVapid(): void {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@barberpro.my";
  if (publicKey && privateKey) {
    configureVapid({ publicKey, privateKey, subject });
    vapidConfigured = true;
  }
}

/**
 * Sends a notification to a customer identified by auth_user_id.
 * Inserts the DB row (Realtime picks it up) and fans out to all push channels.
 */
export async function emitCustomerNotification(
  input: CreateNotificationInput & { sendPush?: boolean }
): Promise<void> {
  const { sendPush = true, ...notifInput } = input;

  try {
    const admin = createAdminClient();
    const row = await createNotification(admin, notifInput);
    if (!row) return;

    if (!sendPush) return;
    ensureVapid();

    const payload: PushPayload = {
      title: notifInput.title,
      body: notifInput.body,
      actionUrl: notifInput.actionUrl,
      data: notifInput.data,
    };

    void sendPushToUser(admin, notifInput.authUserId, payload);
  } catch (err) {
    console.error("[emitCustomerNotification] failed:", err);
  }
}
