import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStaffSession } from "../../contexts/staff-session";
import { useMyEarnings, useAllStaffEarnings } from "../../hooks/use-commissions";
import { isOwnerOrManager } from "../../lib/permissions";
import { formatMYR } from "../../lib/malaysia-date";
import type { Period } from "../../lib/malaysia-date";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default function CommissionsScreen() {
  const { session } = useStaffSession();
  const [period, setPeriod] = useState<Period>("month");
  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");

  const isManager = session ? isOwnerOrManager(session.role) : false;

  const myEarnings = useMyEarnings(
    session?.tenantId ?? "",
    session?.branchId ?? "",
    session?.appUserId ?? "",
    period
  );

  const allEarnings = useAllStaffEarnings(
    session?.tenantId ?? "",
    session?.branchId ?? "",
    period
  );

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-white text-2xl font-bold">Earnings</Text>
      </View>

      {/* Period selector */}
      <View className="flex-row px-5 gap-2 mb-4">
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl items-center border ${
              period === p.key
                ? "border-brand-gold bg-brand-gold/10"
                : "border-brand-border bg-brand-darkcard"
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs font-semibold ${
                period === p.key ? "text-brand-gold" : "text-white/50"
              }`}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* View mode toggle (manager only) */}
      {isManager && (
        <View className="flex-row px-5 gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setViewMode("mine")}
            className={`flex-1 py-2 rounded-xl items-center border ${
              viewMode === "mine" ? "bg-white/10 border-white/20" : "border-brand-border bg-brand-darkcard"
            }`}
          >
            <Text className={`text-sm font-semibold ${viewMode === "mine" ? "text-white" : "text-white/40"}`}>
              My Earnings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("all")}
            className={`flex-1 py-2 rounded-xl items-center border ${
              viewMode === "all" ? "bg-white/10 border-white/20" : "border-brand-border bg-brand-darkcard"
            }`}
          >
            <Text className={`text-sm font-semibold ${viewMode === "all" ? "text-white" : "text-white/40"}`}>
              All Staff
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {viewMode === "mine" || !isManager ? (
        /* My Earnings */
        myEarnings.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#D4AF37" size="large" />
          </View>
        ) : (
          <View className="px-5 gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-brand-darkcard border border-brand-border rounded-2xl p-4">
                <Text className="text-white/50 text-xs uppercase mb-2">Revenue Generated</Text>
                <Text className="text-white text-2xl font-bold">
                  {formatMYR(myEarnings.data?.totalRevenue ?? 0)}
                </Text>
              </View>
              <View className="flex-1 bg-brand-darkcard border border-brand-border rounded-2xl p-4">
                <Text className="text-white/50 text-xs uppercase mb-2">Services Done</Text>
                <Text className="text-white text-2xl font-bold">
                  {myEarnings.data?.serviceCount ?? 0}
                </Text>
              </View>
            </View>

            <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-4">
              <Text className="text-white/50 text-xs uppercase mb-2">Transactions</Text>
              <Text className="text-white text-2xl font-bold">
                {myEarnings.data?.transactionCount ?? 0}
              </Text>
            </View>

            <Text className="text-white/40 text-xs text-center mt-2">
              Commission amounts are calculated by your manager per scheme settings
            </Text>
          </View>
        )
      ) : (
        /* All Staff */
        allEarnings.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#D4AF37" size="large" />
          </View>
        ) : (
          <FlatList
            data={allEarnings.data ?? []}
            keyExtractor={(item) => item.staffId}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-3.5 mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="bg-brand-gold/20 rounded-full w-9 h-9 items-center justify-center">
                    <Text className="text-brand-gold text-sm font-bold">{index + 1}</Text>
                  </View>
                  <View>
                    <Text className="text-white font-semibold">{item.staffName}</Text>
                    <Text className="text-white/50 text-xs">
                      {item.transactionCount} services
                    </Text>
                  </View>
                </View>
                <Text className="text-brand-gold font-bold">
                  {formatMYR(item.totalRevenue)}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Text className="text-white/40 text-base">No earnings data for this period</Text>
              </View>
            }
          />
        )
      )}
    </SafeAreaView>
  );
}
