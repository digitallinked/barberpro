import { Redirect } from "expo-router";
import { useStaffSession } from "../contexts/staff-session";
import { View, ActivityIndicator } from "react-native";

export default function IndexScreen() {
  const { session, isLoading } = useStaffSession();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-dark">
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return session ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
