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
 * and saves it to staff_profiles.expo_push_token.
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

    const { error } = await supabase
      .from("staff_profiles")
      .update({ expo_push_token: token })
      .eq("id", staffProfileId);

    if (!error) {
      await storage.setItem(PUSH_TOKEN_REGISTERED_KEY, staffProfileId);
    }
  } catch (err) {
    // Push registration is non-critical, but log in dev for visibility
    if (__DEV__) console.warn("[notifications] registerForPushNotifications failed:", err);
  }
}
