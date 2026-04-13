import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useStaffSession } from "../../contexts/staff-session";
import { useDashboardStats, useQueueCount, useClockInOut, useStaffProfileId } from "../../hooks/use-dashboard";
import { StatCard } from "../../components/ui/stat-card";
import { OfflineBanner } from "../../components/ui/offline-banner";
import { useNetwork } from "../../hooks/use-network";
import { formatMYR } from "../../lib/malaysia-date";
import type { Period } from "../../lib/malaysia-date";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { session } = useStaffSession();
  const [period, setPeriod] = useState<Period>("today");
  const [refreshing, setRefreshing] = useState(false);

  const { isOffline } = useNetwork();
  const stats = useDashboardStats(session?.tenantId ?? "", session?.branchId ?? "", period);
  const queueCount = useQueueCount(session?.tenantId ?? "", session?.branchId ?? "");

  const { data: staffProfileId = null } = useStaffProfileId(
    session?.appUserId,
    session?.tenantId ?? ""
  );

  const { todayRecord, clockIn, clockOut } = useClockInOut(
    session?.tenantId ?? "",
    session?.branchId ?? "",
    staffProfileId
  );

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([stats.refetch(), queueCount.refetch()]);
    setRefreshing(false);
  }

  const isClockedIn = !!todayRecord?.clock_in && !todayRecord?.clock_out;

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <OfflineBanner />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Header */}
        <View className="mb-6 flex-row items-start justify-between">
          <View>
            <Text className="text-white/60 text-sm">{getGreeting()},</Text>
            <Text className="text-white text-2xl font-bold">{session.fullName}</Text>
            {isOffline && stats.isStale && stats.dataUpdatedAt > 0 && (
              <Text className="text-white/30 text-xs mt-1">
                Cached · last synced {formatDistanceToNow(stats.dataUpdatedAt)} ago
              </Text>
            )}
          </View>
          <TouchableOpacity
            className="bg-brand-darkcard border border-brand-border rounded-full p-2 mt-1"
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Period toggle */}
        <View className="flex-row bg-brand-darkcard border border-brand-border rounded-xl p-1 mb-6">
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-lg items-center ${period === p.key ? "bg-white/10" : ""}`}
            >
              <Text
                className={`text-sm font-semibold ${period === p.key ? "text-white" : "text-white/40"}`}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats grid */}
        <View className="flex-row gap-3 mb-3">
          <StatCard
            className="flex-1"
            title="Revenue"
            value={stats.data ? formatMYR(stats.data.revenue) : "—"}
            subtitle="Total sales"
          />
          <StatCard
            className="flex-1"
            title="Customers"
            value={stats.data?.customers ?? "—"}
            subtitle="Unique served"
          />
        </View>
        <View className="flex-row gap-3 mb-6">
          <StatCard
            className="flex-1"
            title="Transactions"
            value={stats.data?.transactions ?? "—"}
            subtitle="This period"
          />
          <View className="flex-1 bg-brand-darkcard border border-brand-border rounded-2xl p-4">
            <Text className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
              Queue
            </Text>
            <Text className="text-white text-3xl font-bold mb-1">
              {queueCount.data?.waiting ?? "—"}
            </Text>
            <Text className="text-white/50 text-sm">
              waiting · {queueCount.data?.inService ?? 0} in service
            </Text>
          </View>
        </View>

        {/* Clock in/out */}
        <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-4">
          <Text className="text-white/60 text-sm mb-3">Attendance</Text>
          <TouchableOpacity
            onPress={() => {
              if (isClockedIn) {
                Alert.alert("Clock Out", "Are you sure you want to clock out?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clock Out",
                    onPress: () =>
                      clockOut.mutate(undefined, {
                        onError: (e) => Alert.alert("Error", e.message),
                      }),
                  },
                ]);
              } else {
                clockIn.mutate(undefined, {
                  onError: (e) => Alert.alert("Error", e.message),
                });
              }
            }}
            disabled={clockIn.isPending || clockOut.isPending}
            className={`flex-row items-center justify-center gap-2 py-3 rounded-xl ${isClockedIn ? "bg-red-700/20 border border-red-700/30" : "bg-emerald-700/20 border border-emerald-700/30"}`}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isClockedIn ? "exit-outline" : "enter-outline"}
              size={20}
              color={isClockedIn ? "#f87171" : "#34d399"}
            />
            <Text className={`font-semibold text-base ${isClockedIn ? "text-red-400" : "text-emerald-400"}`}>
              {clockIn.isPending || clockOut.isPending
                ? "Processing…"
                : isClockedIn
                ? "Clock Out"
                : "Clock In"}
            </Text>
          </TouchableOpacity>
          {todayRecord?.clock_in && (
            <Text className="text-white/40 text-xs text-center mt-2">
              Clocked in at{" "}
              {new Date(todayRecord.clock_in).toLocaleTimeString("en-MY", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
