import { Tabs } from "expo-router";

export default function StaffTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      <Tabs.Screen name="queue" options={{ title: "Queue" }} />
      <Tabs.Screen name="commissions" options={{ title: "Earnings" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
