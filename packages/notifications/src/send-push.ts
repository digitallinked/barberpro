import webPush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushPayload, VapidConfig } from "./types";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ─── Browser Web Push ─────────────────────────────────────────────────────────

type WebPushRecord = {
  endpoint: string;
  p256dh: string;
  auth_secret: string;
};

/**
 * Sends a browser Web Push notification to all subscriptions for a user.
 * Uses the vapid config from env vars — call once at startup to configure.
 */
export function configureVapid(config: VapidConfig): void {
  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
}

/**
 * Sends to all browser push subscriptions for the given auth_user_id.
 * Expired / invalid subscriptions (410 Gone) are automatically deleted.
 * @param adminClient   service-role client — needed to read + delete subscriptions
 */
export async function sendWebPushToUser(
  adminClient: SupabaseClient,
  authUserId: string,
  payload: PushPayload
): Promise<void> {
  const { data: subs } = await adminClient
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_secret")
    .eq("auth_user_id", authUserId);

  if (!subs || subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    actionUrl: payload.actionUrl ?? "/",
    data: payload.data ?? {},
  });

  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    (subs as WebPushRecord[]).map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_secret },
          },
          body
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error("[web-push] send failed:", err);
        }
      }
    })
  );

  if (expiredEndpoints.length > 0) {
    await adminClient
      .from("push_subscriptions")
      .delete()
      .eq("auth_user_id", authUserId)
      .in("endpoint", expiredEndpoints);
  }
}

// ─── Expo Push (mobile-staff / mobile-customer) ───────────────────────────────

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Sends an Expo push notification to all mobile tokens for the given auth_user_id.
 * Reads from public.mobile_push_tokens (new normalized table).
 * Invalid tokens (DeviceNotRegistered) are automatically deleted.
 * @param adminClient   service-role client
 */
export async function sendExpoPushToUser(
  adminClient: SupabaseClient,
  authUserId: string,
  payload: PushPayload
): Promise<void> {
  const { data: tokens } = await adminClient
    .from("mobile_push_tokens")
    .select("token")
    .eq("auth_user_id", authUserId)
    .eq("platform", "expo");

  if (!tokens || tokens.length === 0) return;

  const messages: ExpoMessage[] = tokens.map((t: { token: string }) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    console.error("[expo-push] send failed:", await response.text());
    return;
  }

  // Check receipts for invalid token errors.
  type ExpoTicket = { status: "ok" | "error"; details?: { error?: string } };
  const { data: tickets }: { data: ExpoTicket[] } = await response.json() as {
    data: ExpoTicket[];
  };

  const invalidTokens = tickets
    .map((ticket, i) =>
      ticket.status === "error" &&
      ticket.details?.error === "DeviceNotRegistered"
        ? (tokens[i] as { token: string }).token
        : null
    )
    .filter(Boolean) as string[];

  if (invalidTokens.length > 0) {
    await adminClient
      .from("mobile_push_tokens")
      .delete()
      .eq("auth_user_id", authUserId)
      .in("token", invalidTokens);
  }
}

// ─── Unified fan-out ──────────────────────────────────────────────────────────

/**
 * Sends a notification to all push channels (web + mobile) for the given user.
 * Best-effort: individual channel failures are logged but do not throw.
 */
export async function sendPushToUser(
  adminClient: SupabaseClient,
  authUserId: string,
  payload: PushPayload
): Promise<void> {
  await Promise.allSettled([
    sendWebPushToUser(adminClient, authUserId, payload),
    sendExpoPushToUser(adminClient, authUserId, payload),
  ]);
}
