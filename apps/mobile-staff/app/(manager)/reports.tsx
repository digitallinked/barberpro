import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { BarChart } from "react-native-gifted-charts";
import { useStaffSession } from "../../contexts/staff-session";
import { useDailyRevenue, useTopServices } from "../../hooks/use-reports";
import { useDashboardStats } from "../../hooks/use-dashboard";
import { formatMYR, formatMYRCompact } from "../../lib/malaysia-date";
import type { Period } from "../../lib/malaysia-date";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "This Week" },
  { key: "month", label: "This Month" },
];

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ReportsScreen() {
  const { session } = useStaffSession();
  const navigation = useNavigation();
  const [period, setPeriod] = useState<Period>("today");

  useEffect(() => {
    navigation.setOptions({ title: "Reports" });
  }, [navigation]);

  const dailyRevenue = useDailyRevenue(session?.tenantId ?? "", session?.branchId ?? "", period);
  const topServices = useTopServices(session?.tenantId ?? "", session?.branchId ?? "", period);
  const stats = useDashboardStats(session?.tenantId ?? "", session?.branchId ?? "", period);

  if (!session) return null;

  const chartData = (dailyRevenue.data ?? []).map((d) => ({
    value: d.revenue,
    label: d.label,
    frontColor: "#D4AF37",
    topLabelComponent: () => null,
  }));

  const maxRevenue = Math.max(...(dailyRevenue.data ?? []).map((d) => d.revenue), 1);

  return (
    <ScrollView
      className="flex-1 bg-brand-dark"
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Period toggle */}
      <View className="flex-row gap-2 mb-6">
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            className={`flex-1 py-2.5 rounded-xl items-center border ${
              period === p.key
                ? "border-brand-gold bg-brand-gold/10"
                : "border-brand-border bg-brand-darkcard"
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-semibold ${period === p.key ? "text-brand-gold" : "text-white/50"}`}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary stats */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-brand-darkcard border border-brand-border rounded-2xl p-4">
          <Text className="text-white/50 text-xs uppercase mb-1">Revenue</Text>
          <Text className="text-white text-xl font-bold">
            {stats.data ? formatMYR(stats.data.revenue) : "—"}
          </Text>
        </View>
        <View className="flex-1 bg-brand-darkcard border border-brand-border rounded-2xl p-4">
          <Text className="text-white/50 text-xs uppercase mb-1">Transactions</Text>
          <Text className="text-white text-xl font-bold">{stats.data?.transactions ?? "—"}</Text>
        </View>
      </View>

      {/* Revenue chart */}
      <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-4 mb-6">
        <Text className="text-white font-semibold mb-4">Revenue Chart</Text>
        {dailyRevenue.isLoading ? (
          <View className="h-40 items-center justify-center">
            <ActivityIndicator color="#D4AF37" />
          </View>
        ) : chartData.length > 0 ? (
          <BarChart
            data={chartData}
            barWidth={period === "today" ? (SCREEN_WIDTH - 120) / 7 - 4 : 8}
            spacing={period === "today" ? 4 : 2}
            roundedTop
            roundedBottom={false}
            hideRules
            xAxisColor="rgba(255,255,255,0.1)"
            yAxisColor="transparent"
            xAxisLabelTextStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}
            yAxisTextStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}
            noOfSections={4}
            maxValue={maxRevenue * 1.2}
            isAnimated
          />
        ) : (
          <View className="h-40 items-center justify-center">
            <Text className="text-white/30 text-sm">No data for this period</Text>
          </View>
        )}
      </View>

      {/* Top services */}
      <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-4">
        <Text className="text-white font-semibold mb-4">Top Services</Text>
        {topServices.isLoading ? (
          <ActivityIndicator color="#D4AF37" />
        ) : (topServices.data ?? []).length === 0 ? (
          <Text className="text-white/30 text-sm">No service data</Text>
        ) : (
          (topServices.data ?? []).slice(0, 5).map((svc, idx) => (
            <View key={svc.name} className="flex-row items-center gap-3 mb-3">
              <Text className="text-white/30 text-sm w-5">{idx + 1}</Text>
              <View className="flex-1">
                <Text className="text-white text-sm mb-1">{svc.name}</Text>
                <View className="h-1 bg-white/10 rounded-full">
                  <View
                    className="h-1 bg-brand-gold rounded-full"
                    style={{
                      width: `${(svc.revenue / ((topServices.data ?? [])[0]?.revenue ?? 1)) * 100}%`,
                    }}
                  />
                </View>
              </View>
              <View className="items-end">
                <Text className="text-brand-gold text-sm font-bold">{formatMYR(svc.revenue)}</Text>
                <Text className="text-white/40 text-xs">{svc.count}×</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
