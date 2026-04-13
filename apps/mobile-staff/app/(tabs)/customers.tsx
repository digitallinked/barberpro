import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useStaffSession } from "../../contexts/staff-session";
import { useCustomers, useCustomerTransactions, type Customer } from "../../hooks/use-customers";
import { formatMYR } from "../../lib/malaysia-date";

function CustomerDetailModal({
  customer,
  tenantId,
  onClose,
}: {
  customer: Customer;
  tenantId: string;
  onClose: () => void;
}) {
  const { data: transactions, isLoading } = useCustomerTransactions(customer.id, tenantId);

  const totalSpend = (transactions ?? []).reduce((sum, t) => sum + (t.total_amount ?? 0), 0);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-brand-dark">
        <SafeAreaView className="flex-1">
          <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-brand-border">
            <Text className="text-white text-xl font-bold">{customer.full_name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
            {/* Contact info */}
            <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-4 mb-4">
              {customer.phone && (
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.5)" />
                  <Text className="text-white/70 text-sm">{customer.phone}</Text>
                </View>
              )}
              {customer.email && (
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.5)" />
                  <Text className="text-white/70 text-sm">{customer.email}</Text>
                </View>
              )}
              {customer.loyalty_points != null && (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="star-outline" size={16} color="#D4AF37" />
                  <Text className="text-brand-gold text-sm">
                    {customer.loyalty_points} loyalty points
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-brand-darkcard border border-brand-border rounded-2xl p-4">
                <Text className="text-white/50 text-xs uppercase mb-1">Total Visits</Text>
                <Text className="text-white text-2xl font-bold">
                  {transactions?.length ?? 0}
                </Text>
              </View>
              <View className="flex-1 bg-brand-darkcard border border-brand-border rounded-2xl p-4">
                <Text className="text-white/50 text-xs uppercase mb-1">Total Spend</Text>
                <Text className="text-white text-2xl font-bold">{formatMYR(totalSpend)}</Text>
              </View>
            </View>

            {/* Visit history */}
            <Text className="text-white font-semibold mb-3">Visit History</Text>
            {isLoading ? (
              <ActivityIndicator color="#D4AF37" />
            ) : (transactions ?? []).length === 0 ? (
              <Text className="text-white/40 text-sm">No transactions yet</Text>
            ) : (
              (transactions ?? []).map((txn: Record<string, unknown>) => (
                <View
                  key={txn.id as string}
                  className="bg-brand-darkcard border border-brand-border rounded-xl p-3 mb-2"
                >
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-white text-sm font-medium">
                      {formatMYR((txn.total_amount as number) ?? 0)}
                    </Text>
                    <Text className="text-white/40 text-xs">
                      {format(parseISO(txn.created_at as string), "d MMM yyyy")}
                    </Text>
                  </View>
                  {((txn.transaction_items as unknown[]) ?? []).map((item: unknown, i: number) => {
                    const it = item as Record<string, unknown>;
                    return (
                      <Text key={i} className="text-white/50 text-xs">
                        {it.name as string} ×{it.quantity as number}
                      </Text>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default function CustomersScreen() {
  const { session } = useStaffSession();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useCustomers(
    session?.tenantId ?? "",
    session?.branchId ?? "",
    search
  );

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-white text-2xl font-bold mb-3">Customers</Text>
        <View className="flex-row items-center bg-brand-darkcard border border-brand-border rounded-xl px-3 gap-2">
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or phone…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="flex-1 py-3 text-white text-sm"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (customers ?? []).length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.2)" />
          <Text className="text-white/40 text-base">
            {search ? "No customers found" : "No customers yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelected(item)}
              className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-3.5 mb-2 flex-row items-center justify-between"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-brand-gold/20 rounded-full w-10 h-10 items-center justify-center">
                  <Text className="text-brand-gold font-bold text-sm">
                    {item.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text className="text-white font-medium">{item.full_name}</Text>
                  {item.phone && (
                    <Text className="text-white/50 text-xs">{item.phone}</Text>
                  )}
                </View>
              </View>
              {item.loyalty_points != null && item.loyalty_points > 0 && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={12} color="#D4AF37" />
                  <Text className="text-brand-gold text-xs">{item.loyalty_points}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {selected && (
        <CustomerDetailModal
          customer={selected}
          tenantId={session.tenantId}
          onClose={() => setSelected(null)}
        />
      )}
    </SafeAreaView>
  );
}
