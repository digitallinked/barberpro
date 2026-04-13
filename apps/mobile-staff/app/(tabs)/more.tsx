import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStaffSession } from "../../contexts/staff-session";
import { getPermissions } from "../../lib/permissions";

type MenuItemConfig = {
  route: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  subtitle: string;
  show: (perms: ReturnType<typeof getPermissions>) => boolean;
};

const MENU_ITEMS: MenuItemConfig[] = [
  {
    route: "/(manager)/staff",
    icon: "people",
    label: "Staff",
    subtitle: "Team members and details",
    show: (p) => p.canManageStaff,
  },
  {
    route: "/(manager)/services",
    icon: "cut",
    label: "Services",
    subtitle: "Service catalog and pricing",
    show: (p) => p.canManageServices,
  },
  {
    route: "/(manager)/inventory",
    icon: "cube",
    label: "Inventory",
    subtitle: "Stock levels and adjustments",
    show: (p) => p.canManageInventory,
  },
  {
    route: "/(manager)/expenses",
    icon: "receipt",
    label: "Expenses",
    subtitle: "Track and log expenses",
    show: (p) => p.canManageExpenses,
  },
  {
    route: "/(manager)/promotions",
    icon: "pricetag",
    label: "Promotions",
    subtitle: "Active discounts and offers",
    show: (p) => p.canManagePromotions,
  },
  {
    route: "/(manager)/reports",
    icon: "bar-chart",
    label: "Reports",
    subtitle: "Revenue analytics and insights",
    show: (p) => p.canViewReports,
  },
];

export default function MoreScreen() {
  const { session } = useStaffSession();

  if (!session) return null;

  const perms = getPermissions(session.role);
  const visibleItems = MENU_ITEMS.filter((item) => item.show(perms));

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-white text-2xl font-bold">More</Text>
        <Text className="text-white/50 text-sm">Management tools</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {visibleItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as never)}
            className="flex-row items-center gap-4 bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-4 mb-3"
            activeOpacity={0.8}
          >
            <View className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl w-12 h-12 items-center justify-center">
              <Ionicons name={item.icon} size={22} color="#D4AF37" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">{item.label}</Text>
              <Text className="text-white/50 text-xs mt-0.5">{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ))}

        {visibleItems.length === 0 && (
          <View className="items-center py-12">
            <Ionicons name="lock-closed-outline" size={48} color="rgba(255,255,255,0.2)" />
            <Text className="text-white/40 text-base mt-3">No management access</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
