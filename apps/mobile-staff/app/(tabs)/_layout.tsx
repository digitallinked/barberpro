import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStaffSession } from "../../contexts/staff-session";
import { getPermissions } from "../../lib/permissions";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type TabConfig = {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
  showFor: (perms: ReturnType<typeof getPermissions>) => boolean;
  /** Hide from tab bar (route still navigable via router.push). Defaults to true. */
  inTabBar?: boolean;
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
    inTabBar: false,
  },
  {
    name: "commissions",
    title: "Earnings",
    icon: "cash-outline",
    activeIcon: "cash",
    showFor: (p) => p.canAccessCommissions,
    inTabBar: false,
  },
  {
    name: "more",
    title: "More",
    icon: "menu-outline",
    activeIcon: "menu",
    showFor: () => true,
  },
  {
    name: "profile",
    title: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    showFor: () => true,
    inTabBar: false,
  },
];

export default function StaffTabLayout() {
  const { session, isLoading } = useStaffSession();
  const insets = useSafeAreaInsets();
  /** Gesture / 3-button nav inset; small fallback when OEM reports 0 incorrectly */
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0);

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
          backgroundColor: "#1c1c1c",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: bottomInset,
          height: 52 + 6 + bottomInset,
        },
        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "rgba(255,255,255,0.35)",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
      }}
    >
      {TAB_CONFIGS.map((tab) => {
        const hasPermission = tab.showFor(perms);
        const showInBar = (tab.inTabBar ?? true) && hasPermission;
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              href: showInBar ? undefined : null,
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
