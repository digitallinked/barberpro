import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useNavigation } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useStaffSession } from "../../../contexts/staff-session";
import { useStaffMembers } from "../../../hooks/use-staff";
import { getRoleLabel } from "../../../lib/permissions";

export default function StaffListScreen() {
  const { session } = useStaffSession();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: "Staff" });
  }, [navigation]);

  const { data: staff, isLoading } = useStaffMembers(
    session?.tenantId ?? "",
    session?.branchId ?? ""
  );

  if (!session) return null;

  return (
    <View className="flex-1 bg-brand-dark">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={staff ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(manager)/staff/${item.staff_profile_id}` as never)}
              className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-3.5 mb-2 flex-row items-center justify-between"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`rounded-full w-10 h-10 items-center justify-center ${
                    item.is_active ? "bg-emerald-500/20" : "bg-white/10"
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      item.is_active ? "text-emerald-400" : "text-white/40"
                    }`}
                  >
                    {item.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text className="text-white font-semibold">{item.full_name}</Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-white/50 text-xs">{getRoleLabel(item.role as never)}</Text>
                    {!item.is_active && (
                      <Text className="text-red-400 text-xs">· Inactive</Text>
                    )}
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text className="text-white/40 text-base mt-3">No staff members</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
