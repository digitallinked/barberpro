import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { useStaffSession } from "../../contexts/staff-session";
import { useServices, useServiceActions } from "../../hooks/use-services";
import { formatMYR } from "../../lib/malaysia-date";
import { Ionicons } from "@expo/vector-icons";

export default function ServicesScreen() {
  const { session } = useStaffSession();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: "Services" });
  }, [navigation]);

  const { data: services, isLoading } = useServices(session?.tenantId ?? "");
  const { updateService } = useServiceActions(session?.tenantId ?? "");

  function handleToggleActive(id: string, currentlyActive: boolean) {
    Alert.alert(
      currentlyActive ? "Deactivate Service" : "Activate Service",
      `Are you sure you want to ${currentlyActive ? "deactivate" : "activate"} this service?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            updateService.mutate(
              { id, is_active: !currentlyActive },
              { onError: (e) => Alert.alert("Error", e.message) }
            ),
        },
      ]
    );
  }

  if (!session) return null;

  return (
    <View className="flex-1 bg-brand-dark">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={services ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-4 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white font-semibold flex-1 mr-2">{item.name}</Text>
                <Text className="text-brand-gold font-bold">{formatMYR(item.price)}</Text>
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.4)" />
                  <Text className="text-white/50 text-xs">{item.duration_min} min</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleActive(item.id, item.is_active)}
                  className={`rounded-full px-3 py-1 border ${
                    item.is_active
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      item.is_active ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="cut-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text className="text-white/40 text-base mt-3">No services found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
