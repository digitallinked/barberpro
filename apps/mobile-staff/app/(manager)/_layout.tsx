import { Stack } from "expo-router";

export default function ManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#16213e" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "600" },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: "#1a1a2e" },
      }}
    />
  );
}
