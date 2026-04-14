import { Stack, Redirect } from "expo-router";
import { useStaffSession } from "../../contexts/staff-session";
import { isOwnerOrManager } from "../../lib/permissions";

export default function ManagerLayout() {
  const { session } = useStaffSession();

  // Block non-manager roles even if they navigate here directly via deep link
  if (session && !isOwnerOrManager(session.role)) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1c1c1c" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "600" },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: "#121212" },
      }}
    />
  );
}
