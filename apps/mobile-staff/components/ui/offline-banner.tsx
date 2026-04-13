import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../../hooks/use-network";

/**
 * Displays an amber banner when the device has no internet connection.
 * Shows a pending sync count when there are queued offline mutations.
 */
export function OfflineBanner() {
  const { isOffline, pendingCount } = useNetwork();

  if (!isOffline) return null;

  return (
    <View className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex-row items-center gap-2">
      <Ionicons name="cloud-offline-outline" size={14} color="#f59e0b" />
      <Text className="text-amber-400 text-xs font-medium flex-1">
        Offline — changes will sync when connected
      </Text>
      {pendingCount > 0 && (
        <View className="bg-amber-500/30 rounded-full px-2 py-0.5">
          <Text className="text-amber-300 text-xs font-bold">{pendingCount} pending</Text>
        </View>
      )}
    </View>
  );
}
