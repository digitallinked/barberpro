import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useStaffSession } from "../../../contexts/staff-session";
import { useStaffMembers } from "../../../hooks/use-staff";
import { getRoleLabel } from "../../../lib/permissions";
import type { UserRole } from "../../../lib/auth";
import { format, parseISO } from "date-fns";

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View className="py-3 border-b border-brand-border">
      <Text className="text-white/50 text-xs mb-0.5">{label}</Text>
      <Text className="text-white text-sm">{value}</Text>
    </View>
  );
}

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useStaffSession();
  const navigation = useNavigation();

  const { data: allStaff, isLoading } = useStaffMembers(session?.tenantId ?? "");

  const staff = allStaff?.find((s) => s.staff_profile_id === id);

  useEffect(() => {
    navigation.setOptions({ title: staff?.full_name ?? "Staff Detail" });
  }, [navigation, staff]);

  if (!session) return null;

  if (isLoading) {
    return (
      <View className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (!staff) {
    return (
      <View className="flex-1 bg-brand-dark items-center justify-center">
        <Text className="text-white/40">Staff member not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-brand-dark"
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar header */}
      <View className="items-center mb-6">
        <View className="bg-brand-gold/20 border-2 border-brand-gold rounded-full w-20 h-20 items-center justify-center mb-3">
          <Text className="text-brand-gold text-3xl font-bold">
            {staff.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-white text-xl font-bold">{staff.full_name}</Text>
        <View className="flex-row gap-2 mt-1">
          <View className="bg-brand-gold/10 border border-brand-gold/30 rounded-full px-3 py-0.5">
            <Text className="text-brand-gold text-xs font-semibold">
              {getRoleLabel(staff.role as UserRole)}
            </Text>
          </View>
          <View
            className={`rounded-full px-3 py-0.5 border ${
              staff.is_active
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                staff.is_active ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {staff.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      {/* Contact */}
      <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 mb-4">
        <Text className="text-white/60 text-sm py-3 border-b border-brand-border">Contact</Text>
        <DetailRow label="Email" value={staff.email} />
        <DetailRow label="Phone" value={staff.phone} />
      </View>

      {/* Employment */}
      <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 mb-4">
        <Text className="text-white/60 text-sm py-3 border-b border-brand-border">Employment</Text>
        <DetailRow label="Type" value={staff.employment_type} />
        <DetailRow
          label="Base Salary"
          value={staff.base_salary ? `RM ${staff.base_salary.toFixed(2)}` : null}
        />
        <DetailRow
          label="Joined"
          value={staff.joined_at ? format(parseISO(staff.joined_at), "d MMMM yyyy") : null}
        />
      </View>
    </ScrollView>
  );
}
