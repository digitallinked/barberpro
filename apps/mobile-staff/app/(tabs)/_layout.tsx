import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { useStaffSession } from "../../contexts/staff-session";
import { getPermissions } from "../../lib/permissions";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type TabConfig = {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
  showFor: (perms: ReturnType<typeof getPermissions>) => boolean;
};

const TAB_CONFIGS: TabConfig[] = [
  {
    name: "home",
    title: "Home",
    icon: "home-outline",
    activeIcon: "home",
    showFor: () => true,
  },
  {
    name: "queue",
    title: "Queue",
    icon: "time-outline",
    activeIcon: "time",
    showFor: (p) => p.canAccessQueue,
  },
  {
    name: "schedule",
    title: "Schedule",
    icon: "calendar-outline",
    activeIcon: "calendar",
    showFor: (p) => p.canAccessSchedule,
  },
  {
    name: "pos",
    title: "POS",
    icon: "card-outline",
    activeIcon: "card",
    showFor: (p) => p.canAccessPos,
  },
  {
    name: "customers",
    title: "Customers",
    icon: "people-outline",
    activeIcon: "people",
    showFor: (p) => p.canAccessCustomers,
  },
  {
    name: "commissions",
    title: "Earnings",
    icon: "cash-outline",
    activeIcon: "cash",
    showFor: (p) => p.canAccessCommissions,
  },
  {
    name: "more",
    title: "More",
    icon: "menu-outline",
    activeIcon: "menu",
    showFor: (p) => p.canAccessMore,
  },
  {
    name: "profile",
    title: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    showFor: () => true,
  },
];

export default function StaffTabLayout() {
  const { session, isLoading } = useStaffSession();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-dark">
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const perms = getPermissions(session.role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#16213e",
          borderTopColor: "#2a2a4a",
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
        tabBarLabelStyle: { fontSize: 10, marginBottom: 2 },
      }}
    >
      {TAB_CONFIGS.map((tab) => {
        const visible = tab.showFor(perms);
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              href: visible ? undefined : null,
              tabBarIcon: ({ focused, color }) => (
                <Ionicons
                  name={focused ? tab.activeIcon : tab.icon}
                  size={22}
                  color={color}
                />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
