import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from "react-native";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useStaffSession } from "../../contexts/staff-session";
import { useInventory, useInventoryActions, type InventoryItem } from "../../hooks/use-inventory";

function AdjustModal({
  item,
  tenantId,
  branchId,
  appUserId,
  onClose,
}: {
  item: InventoryItem;
  tenantId: string;
  branchId: string;
  appUserId: string;
  onClose: () => void;
}) {
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"restock" | "usage">("restock");
  const { adjustStock } = useInventoryActions(tenantId, branchId, appUserId);

  function handleSubmit() {
    const qtyNum = parseInt(qty, 10);
    if (!qtyNum || qtyNum <= 0) {
      Alert.alert("Invalid", "Enter a valid quantity.");
      return;
    }
    adjustStock.mutate(
      { itemId: item.id, qty: qtyNum, reason: reason || "Manual adjustment", movementType: mode },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-brand-dark p-6 pt-8">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-xl font-bold">Adjust Stock</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <Text className="text-white font-semibold mb-1">{item.name}</Text>
        <Text className="text-white/50 text-sm mb-6">Current: {item.stock_qty} units</Text>

        <View className="flex-row gap-2 mb-4">
          {(["restock", "usage"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              className={`flex-1 py-3 rounded-xl border items-center ${
                mode === m ? "border-brand-gold bg-brand-gold/10" : "border-brand-border bg-brand-darkcard"
              }`}
            >
              <Text className={`font-semibold capitalize ${mode === m ? "text-brand-gold" : "text-white/50"}`}>
                {m === "restock" ? "Restock (+)" : "Usage (-)"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-white/70 text-sm mb-1.5">Quantity</Text>
        <TextInput
          value={qty}
          onChangeText={setQty}
          keyboardType="number-pad"
          placeholder="1"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3 text-white mb-4"
        />

        <Text className="text-white/70 text-sm mb-1.5">Reason (optional)</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. Weekly restock"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3 text-white mb-6"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={adjustStock.isPending}
          className={`bg-brand-gold rounded-xl py-4 items-center ${adjustStock.isPending ? "opacity-60" : ""}`}
          activeOpacity={0.8}
        >
          <Text className="text-brand-dark font-bold text-base">
            {adjustStock.isPending ? "Saving…" : "Save Adjustment"}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function InventoryScreen() {
  const { session } = useStaffSession();
  const navigation = useNavigation();
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: "Inventory" });
  }, [navigation]);

  const { data: items, isLoading } = useInventory(session?.tenantId ?? "", session?.branchId ?? "");

  if (!session) return null;

  return (
    <View className="flex-1 bg-brand-dark">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isLow =
              item.reorder_level != null && item.stock_qty <= item.reorder_level;

            return (
              <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-4 mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold flex-1 mr-2">{item.name}</Text>
                  <TouchableOpacity
                    onPress={() => setAdjustItem(item)}
                    className="bg-brand-gold/10 border border-brand-gold/30 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-brand-gold text-xs font-semibold">Adjust</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className={`text-sm font-bold ${isLow ? "text-orange-400" : "text-white"}`}>
                    {item.stock_qty} in stock
                  </Text>
                  {isLow && (
                    <View className="bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5">
                      <Text className="text-orange-400 text-xs">Low Stock</Text>
                    </View>
                  )}
                </View>
                {item.reorder_level != null && (
                  <Text className="text-white/40 text-xs mt-1">
                    Reorder at: {item.reorder_level}
                  </Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="cube-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text className="text-white/40 text-base mt-3">No inventory items</Text>
            </View>
          }
        />
      )}

      {adjustItem && session && (
        <AdjustModal
          item={adjustItem}
          tenantId={session.tenantId}
          branchId={session.branchId}
          appUserId={session.appUserId}
          onClose={() => setAdjustItem(null)}
        />
      )}
    </View>
  );
}
