// Notification domain types shared across web-shop, web-customer, and mobile apps.

export type NotificationCategory =
  | "queue_alert"
  | "booking"
  | "payment"
  | "reminder"
  | "general";

export type NotificationRecipient =
  | { type: "staff"; authUserId: string; tenantId?: string }
  | { type: "customer"; authUserId: string };

export type CreateNotificationInput = {
  /** Auth user to receive the notification (auth.users.id). */
  authUserId: string;
  /** Tenant the notification is scoped to — optional for customer-global events. */
  tenantId?: string;
  title: string;
  body: string;
  category: NotificationCategory;
  /** Deep-link the user to this URL when they click the notification. */
  actionUrl?: string;
  /** Extra data sent to push handlers (deep link params, IDs etc.) */
  data?: Record<string, string>;
};

export type NotificationRow = {
  id: string;
  auth_user_id: string;
  tenant_id: string | null;
  title: string;
  body: string;
  data: Record<string, string> | null;
  action_url: string | null;
  category: NotificationCategory;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

/** Stored in public.push_subscriptions — matches the PushSubscription Web API shape. */
export type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth_secret: string;
};

/** Expo push token row from public.mobile_push_tokens. */
export type MobilePushToken = {
  auth_user_id: string;
  token: string;
  platform: string;
};

export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export type PushPayload = {
  title: string;
  body: string;
  actionUrl?: string;
  data?: Record<string, string>;
};
