import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStaffSession } from "../../contexts/staff-session";
import { getPermissions, getRoleLabel } from "../../lib/permissions";
import { supabase } from "../../lib/supabase";

type MenuItemConfig = {
  route: Href;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  show: (perms: ReturnType<typeof getPermissions>) => boolean;
};

const QUICK_ITEMS: MenuItemConfig[] = [
  {
    route: "/(tabs)/customers",
    icon: "people-outline",
    label: "Customers",
    show: (p) => p.canAccessCustomers,
  },
  {
    route: "/(tabs)/commissions",
    icon: "cash-outline",
    label: "Earnings",
    show: (p) => p.canAccessCommissions,
  },
];

const MANAGER_ITEMS: MenuItemConfig[] = [
  {
    route: "/(manager)/staff",
    icon: "people",
    label: "Staff",
    show: (p) => p.canManageStaff,
  },
  {
    route: "/(manager)/services",
    icon: "cut",
    label: "Services",
    show: (p) => p.canManageServices,
  },
  {
    route: "/(manager)/inventory",
    icon: "cube-outline",
    label: "Inventory",
    show: (p) => p.canManageInventory,
  },
  {
    route: "/(manager)/expenses",
    icon: "receipt-outline",
    label: "Expenses",
    show: (p) => p.canManageExpenses,
  },
  {
    route: "/(manager)/promotions",
    icon: "pricetag-outline",
    label: "Promotions",
    show: (p) => p.canManagePromotions,
  },
  {
    route: "/(manager)/reports",
    icon: "bar-chart-outline",
    label: "Reports",
    show: (p) => p.canViewReports,
  },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <View className="px-4 py-2.5 border-b border-brand-border">
      <Text className="text-white/40 text-xs font-semibold uppercase tracking-widest">
        {label}
      </Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-4 px-4 py-3.5 ${last ? "" : "border-b border-brand-border"}`}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.55)" />
      <Text className="flex-1 text-base font-medium text-white">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { session, clearSession } = useStaffSession();

  if (!session) return null;

  const perms = getPermissions(session.role);
  const quickItems = QUICK_ITEMS.filter((item) => item.show(perms));
  const managerItems = MANAGER_ITEMS.filter((item) => item.show(perms));

  const initials = session.fullName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-brand-border">
        <Text className="text-white text-2xl font-bold">More</Text>
        <TouchableOpacity
          className="p-2 bg-brand-darkcard border border-brand-border rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          className="flex-row items-center gap-3 mx-4 mt-4 mb-1 bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-4"
          activeOpacity={0.8}
        >
          <View className="bg-brand-gold/20 border-2 border-brand-gold/50 rounded-full w-12 h-12 items-center justify-center">
            <Text className="text-brand-gold text-lg font-bold">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">{session.fullName}</Text>
            <Text className="text-white/50 text-xs mt-0.5">{getRoleLabel(session.role)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        {/* Quick access */}
        {quickItems.length > 0 && (
          <View className="mx-4 mt-3 bg-brand-darkcard border border-brand-border rounded-2xl overflow-hidden">
            <SectionHeader label="Quick Access" />
            {quickItems.map((item, i) => (
              <MenuItem
                key={item.route}
                icon={item.icon}
                label={item.label}
                onPress={() => router.push(item.route)}
                last={i === quickItems.length - 1}
              />
            ))}
          </View>
        )}

        {/* Management */}
        {managerItems.length > 0 && (
          <View className="mx-4 mt-3 bg-brand-darkcard border border-brand-border rounded-2xl overflow-hidden">
            <SectionHeader label="Management" />
            {managerItems.map((item, i) => (
              <MenuItem
                key={item.route}
                icon={item.icon}
                label={item.label}
                onPress={() => router.push(item.route)}
                last={i === managerItems.length - 1}
              />
            ))}
          </View>
        )}

        {/* Account */}
        <View className="mx-4 mt-3 bg-brand-darkcard border border-brand-border rounded-2xl overflow-hidden">
          <SectionHeader label="Account" />
          <MenuItem
            icon="person-outline"
            label="Profile"
            onPress={() => router.push("/(tabs)/profile")}
          />
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center gap-4 px-4 py-3.5"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
            <Text className="flex-1 text-base font-medium text-red-400">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
