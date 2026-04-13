import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useStaffSession } from "../../contexts/staff-session";
import { useExpenses, useExpenseActions } from "../../hooks/use-expenses";
import { formatMYR } from "../../lib/malaysia-date";

const CATEGORIES = [
  "Supplies", "Utilities", "Rent", "Marketing", "Equipment", "Salary", "Maintenance", "Other"
];

function AddExpenseModal({
  tenantId,
  branchId,
  appUserId,
  onClose,
}: {
  tenantId: string;
  branchId: string;
  appUserId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const today = new Date().toISOString().split("T")[0]!;

  const { createExpense } = useExpenseActions(tenantId, branchId, appUserId);

  function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid", "Enter a valid amount.");
      return;
    }
    createExpense.mutate(
      { amount: amt, category, expenseDate: today, vendor: vendor.trim() || undefined, notes: notes.trim() || undefined },
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
          <Text className="text-white text-xl font-bold">Add Expense</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <Text className="text-white/70 text-sm mb-1.5">Amount (RM)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3 text-white text-lg mb-4"
        />

        <Text className="text-white/70 text-sm mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg border ${
                category === cat
                  ? "border-brand-gold bg-brand-gold/10"
                  : "border-brand-border bg-brand-darkcard"
              }`}
            >
              <Text className={`text-sm ${category === cat ? "text-brand-gold" : "text-white/60"}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-white/70 text-sm mb-1.5">Vendor (optional)</Text>
        <TextInput
          value={vendor}
          onChangeText={setVendor}
          placeholder="e.g. Supplier name"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3 text-white mb-4"
        />

        <Text className="text-white/70 text-sm mb-1.5">Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          numberOfLines={2}
          className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3 text-white mb-6"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createExpense.isPending}
          className={`bg-brand-gold rounded-xl py-4 items-center ${createExpense.isPending ? "opacity-60" : ""}`}
          activeOpacity={0.8}
        >
          <Text className="text-brand-dark font-bold text-base">
            {createExpense.isPending ? "Saving…" : "Add Expense"}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function ExpensesScreen() {
  const { session } = useStaffSession();
  const navigation = useNavigation();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: "Expenses" });
  }, [navigation]);

  const { data: expenses, isLoading } = useExpenses(session?.tenantId ?? "", session?.branchId ?? "");

  if (!session) return null;

  const thisMonthTotal = (expenses ?? [])
    .filter((e) => {
      const d = new Date(e.expense_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return (
    <View className="flex-1 bg-brand-dark">
      {/* Month summary */}
      <View className="mx-5 mt-5 bg-brand-darkcard border border-brand-border rounded-2xl p-4 mb-4">
        <Text className="text-white/50 text-xs uppercase mb-1">This Month</Text>
        <Text className="text-white text-2xl font-bold">{formatMYR(thisMonthTotal)}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={expenses ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-3.5 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white font-semibold">{item.category}</Text>
                <Text className="text-white font-bold">{formatMYR(item.amount)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-white/50 text-xs">
                  {item.vendor ?? "No vendor"} · {format(parseISO(item.expense_date), "d MMM yyyy")}
                </Text>
                <View className={`rounded-full px-2 py-0.5 border ${
                  item.status === "paid"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-yellow-500/20 bg-yellow-500/10"
                }`}>
                  <Text className={`text-xs ${item.status === "paid" ? "text-emerald-400" : "text-yellow-400"}`}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text className="text-white/40 text-base mt-3">No expenses recorded</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowAdd(true)}
        className="absolute bottom-6 right-6 bg-brand-gold w-14 h-14 rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#121212" />
      </TouchableOpacity>

      {showAdd && (
        <AddExpenseModal
          tenantId={session.tenantId}
          branchId={session.branchId}
          appUserId={session.appUserId}
          onClose={() => setShowAdd(false)}
        />
      )}
    </View>
  );
}
