import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useStaffSession } from "../../contexts/staff-session";
import { useServices } from "../../hooks/use-services";
import { usePosTransaction, type CartItem, type PaymentMethod } from "../../hooks/use-pos";
import { OfflineBanner } from "../../components/ui/offline-banner";
import { formatMYR } from "../../lib/malaysia-date";

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: "cash", label: "Cash", icon: "cash-outline" },
  { key: "qr", label: "QR Pay", icon: "qr-code-outline" },
  { key: "card", label: "Card", icon: "card-outline" },
];

function ReceiptModal({
  visible,
  total,
  items,
  paymentMethod,
  savedOffline,
  onDone,
}: {
  visible: boolean;
  total: number;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  savedOffline: boolean;
  onDone: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/70 items-center justify-center p-6">
        <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center mb-4">
            <View
              className={`rounded-full w-16 h-16 items-center justify-center mb-3 ${
                savedOffline ? "bg-amber-500/20" : "bg-emerald-500/20"
              }`}
            >
              <Ionicons
                name={savedOffline ? "cloud-offline-outline" : "checkmark-circle"}
                size={36}
                color={savedOffline ? "#f59e0b" : "#34d399"}
              />
            </View>
            <Text className="text-white text-xl font-bold">
              {savedOffline ? "Payment Saved Offline" : "Payment Received"}
            </Text>
            <Text className="text-brand-gold text-3xl font-bold mt-1">{formatMYR(total)}</Text>
            {savedOffline && (
              <Text className="text-amber-400/80 text-xs text-center mt-2">
                Will sync to server when internet is restored
              </Text>
            )}
          </View>

          <View className="gap-1 mb-4">
            {items.map((item, idx) => (
              <View key={idx} className="flex-row justify-between">
                <Text className="text-white/70 text-sm">
                  {item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}
                </Text>
                <Text className="text-white/70 text-sm">
                  {formatMYR(item.unitPrice * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          <View className="border-t border-brand-border pt-3 mb-4">
            <View className="flex-row justify-between">
              <Text className="text-white font-semibold">Total</Text>
              <Text className="text-white font-semibold">{formatMYR(total)}</Text>
            </View>
            <Text className="text-white/40 text-xs mt-1 capitalize">{paymentMethod}</Text>
          </View>

          <TouchableOpacity
            onPress={onDone}
            className="bg-brand-gold rounded-xl py-3 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-brand-dark font-bold">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function PosScreen() {
  const { session } = useStaffSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  const services = useServices(session?.tenantId ?? "");
  const { submitWithOfflineFallback } = usePosTransaction(
    session?.tenantId ?? "",
    session?.branchId ?? "",
    session?.appUserId ?? ""
  );

  function addToCart(item: Omit<CartItem, "quantity">) {
    setCart((prev) => {
      const existing = prev.find((c) => c.serviceId === item.serviceId && c.name === item.name);
      if (existing) {
        return prev.map((c) =>
          c === existing ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function changeQty(index: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item, i) => (i === index ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmt = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmt);

  function handleCheckout() {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Add at least one item to checkout.");
      return;
    }
    Alert.alert(
      "Confirm Payment",
      `Total: ${formatMYR(total)}\nMethod: ${paymentMethod.toUpperCase()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const result = await submitWithOfflineFallback({
                cart,
                paymentMethod,
                discountAmount: discountAmt,
              });
              setSavedOffline(result.savedOffline);
              setShowReceipt(true);
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Checkout failed");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }

  function handleReceiptDone() {
    setShowReceipt(false);
    setSavedOffline(false);
    setCart([]);
    setDiscount("");
    setPaymentMethod("cash");
  }

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <OfflineBanner />
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">POS</Text>
        {cart.length > 0 && (
          <View className="bg-brand-gold rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-brand-dark text-xs font-bold">{cart.length}</Text>
          </View>
        )}
      </View>

      <View className="flex-1 flex-row">
        {/* Left: service selector */}
        <View className="flex-1 border-r border-brand-border">
          <View className="flex-row border-b border-brand-border">
            {(["services", "products"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 items-center border-b-2 ${
                  activeTab === tab ? "border-brand-gold" : "border-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-semibold capitalize ${
                    activeTab === tab ? "text-brand-gold" : "text-white/40"
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {services.isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : (
            <FlatList
              data={activeTab === "services" ? services.data ?? [] : []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 8 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    addToCart({
                      serviceId: item.id,
                      inventoryItemId: null,
                      name: item.name,
                      unitPrice: item.price,
                      itemType: "service",
                    })
                  }
                  className="mb-2 bg-brand-darkcard border border-brand-border rounded-xl px-3 py-3"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-sm font-medium mb-0.5">{item.name}</Text>
                  <Text className="text-brand-gold text-xs">{formatMYR(item.price)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-white/30 text-sm">No items</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Right: cart + checkout */}
        <View className="w-52 flex-col">
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 8 }}>
            {cart.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="cart-outline" size={32} color="rgba(255,255,255,0.2)" />
                <Text className="text-white/30 text-xs mt-2 text-center">Cart is empty</Text>
              </View>
            ) : (
              cart.map((item, idx) => (
                <View
                  key={idx}
                  className="mb-2 bg-brand-darkcard border border-brand-border rounded-xl p-3"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <Text className="text-white text-xs font-medium flex-1 mr-1" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeFromCart(idx)}>
                      <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => changeQty(idx, -1)}
                        className="bg-white/10 rounded-md w-6 h-6 items-center justify-center"
                      >
                        <Ionicons name="remove" size={12} color="white" />
                      </TouchableOpacity>
                      <Text className="text-white text-sm">{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => changeQty(idx, 1)}
                        className="bg-white/10 rounded-md w-6 h-6 items-center justify-center"
                      >
                        <Ionicons name="add" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-brand-gold text-xs">
                      {formatMYR(item.unitPrice * item.quantity)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Checkout panel */}
          <View className="border-t border-brand-border p-3 gap-2">
            <TextInput
              value={discount}
              onChangeText={setDiscount}
              placeholder="Discount (RM)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="decimal-pad"
              className="bg-brand-darkcard border border-brand-border rounded-lg px-3 py-2 text-white text-xs"
            />

            <View className="flex-row gap-1">
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.key}
                  onPress={() => setPaymentMethod(pm.key)}
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    paymentMethod === pm.key
                      ? "border-brand-gold bg-brand-gold/10"
                      : "border-brand-border bg-brand-darkcard"
                  }`}
                >
                  <Ionicons
                    name={pm.icon as React.ComponentProps<typeof Ionicons>["name"]}
                    size={14}
                    color={paymentMethod === pm.key ? "#D4AF37" : "rgba(255,255,255,0.4)"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-between">
              <Text className="text-white/60 text-xs">Total</Text>
              <Text className="text-white font-bold text-sm">{formatMYR(total)}</Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className={`bg-brand-gold rounded-xl py-3 items-center ${
                cart.length === 0 || isSubmitting ? "opacity-40" : ""
              }`}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <Text className="text-brand-dark font-bold text-sm">Checkout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ReceiptModal
        visible={showReceipt}
        total={total}
        items={cart}
        paymentMethod={paymentMethod}
        savedOffline={savedOffline}
        onDone={handleReceiptDone}
      />
    </SafeAreaView>
  );
}
