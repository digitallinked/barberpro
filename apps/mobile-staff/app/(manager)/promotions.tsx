import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useStaffSession } from "../../contexts/staff-session";
import { usePromotions } from "../../hooks/use-promotions";

export default function PromotionsScreen() {
  const { session } = useStaffSession();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: "Promotions" });
  }, [navigation]);

  const { data: promotions, isLoading } = usePromotions(session?.tenantId ?? "");

  if (!session) return null;

  return (
    <View className="flex-1 bg-brand-dark">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={promotions ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const now = new Date();
            const hasStarted = !item.start_date || new Date(item.start_date) <= now;
            const hasEnded = item.end_date && new Date(item.end_date) < now;
            const isLive = item.is_active && hasStarted && !hasEnded;

            return (
              <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-4 mb-3">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-white font-semibold text-base flex-1 mr-2">
                    {item.name}
                  </Text>
                  <View
                    className={`rounded-full px-2.5 py-0.5 border ${
                      isLive
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${isLive ? "text-emerald-400" : "text-white/40"}`}
                    >
                      {isLive ? "Live" : hasEnded ? "Ended" : "Inactive"}
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text className="text-white/60 text-sm mb-2">{item.description}</Text>
                )}

                <View className="flex-row items-center gap-3">
                  <View className="bg-brand-gold/10 border border-brand-gold/20 rounded-lg px-3 py-1.5">
                    <Text className="text-brand-gold text-sm font-bold">
                      {item.discount_type === "percentage"
                        ? `${item.discount_value}% off`
                        : `RM ${item.discount_value.toFixed(2)} off`}
                    </Text>
                  </View>
                  {item.min_spend && (
                    <Text className="text-white/40 text-xs">
                      Min spend: RM {item.min_spend.toFixed(2)}
                    </Text>
                  )}
                </View>

                {(item.start_date || item.end_date) && (
                  <Text className="text-white/40 text-xs mt-2">
                    {item.start_date ? format(parseISO(item.start_date), "d MMM") : "—"} →{" "}
                    {item.end_date ? format(parseISO(item.end_date), "d MMM yyyy") : "Ongoing"}
                  </Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="pricetag-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text className="text-white/40 text-base mt-3">No promotions found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
