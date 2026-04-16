import Constants from "expo-constants";
import { supabase } from "./supabase";
import { storage } from "./storage";

const PUSH_TOKEN_REGISTERED_KEY = "push_token_registered_for";

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Configures the in-app notification presentation style.
 * Call once at app startup from _layout.tsx.
 * Skipped silently in Expo Go.
 */
export async function setupNotificationHandler(): Promise<void> {
  if (isExpoGo()) return;
  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Requests push notification permissions, gets an Expo push token,
 * and saves it to:
 *   • public.mobile_push_tokens   (new normalized table — used for fan-out)
 *   • staff_profiles.expo_push_token  (legacy compat — kept until column retired)
 *
 * No-ops in Expo Go and on simulators.
 * Guarded against re-running for the same staffProfileId.
 */
export async function registerForPushNotifications(staffProfileId: string): Promise<void> {
  if (isExpoGo()) return;

  const alreadyRegistered = await storage.getItem(PUSH_TOKEN_REGISTERED_KEY);
  if (alreadyRegistered === staffProfileId) return;

  try {
    const [Notifications, Device] = await Promise.all([
      import("expo-notifications"),
      import("expo-device"),
    ]);

    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    if (!token) return;

    // Get the current auth user id for the normalized token table.
    const { data: { user } } = await supabase.auth.getUser();

    // Write to the new normalized table (upsert — safe to call repeatedly).
    if (user?.id) {
      await supabase
        .from("mobile_push_tokens")
        .upsert(
          { auth_user_id: user.id, token, platform: "expo" },
          { onConflict: "auth_user_id,token" }
        );
    }

    // Keep legacy column in sync until it is retired.
    await supabase
      .from("staff_profiles")
      .update({ expo_push_token: token })
      .eq("id", staffProfileId);

    await storage.setItem(PUSH_TOKEN_REGISTERED_KEY, staffProfileId);
  } catch (err) {
    if (__DEV__) console.warn("[notifications] registerForPushNotifications failed:", err);
  }
}

/**
 * Removes the push token for this device from both the normalized table
 * and the legacy column. Call on sign-out.
 */
export async function unregisterPushNotifications(staffProfileId: string): Promise<void> {
  if (isExpoGo()) return;

  try {
    const [Notifications, Device] = await Promise.all([
      import("expo-notifications"),
      import("expo-device"),
    ]);

    if (!Device.isDevice) return;

    const sub = await Notifications.getExpoPushTokenAsync(undefined).catch(() => null);
    const token = sub?.data;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from("mobile_push_tokens")
          .delete()
          .eq("auth_user_id", user.id)
          .eq("token", token);
      }
    }

    // Clear legacy column
    await supabase
      .from("staff_profiles")
      .update({ expo_push_token: null })
      .eq("id", staffProfileId);

    await storage.removeItem(PUSH_TOKEN_REGISTERED_KEY);
  } catch (err) {
    if (__DEV__) console.warn("[notifications] unregisterPushNotifications failed:", err);
  }
}
