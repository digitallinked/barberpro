import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useStaffSession } from "../../contexts/staff-session";
import { useQueueTickets, useQueueActions, type QueueTicket } from "../../hooks/use-queue";
import { useServices } from "../../hooks/use-services";
import { Badge } from "../../components/ui/badge";

function WaitTime({ createdAt }: { createdAt: string }) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  return (
    <Text className="text-white/40 text-xs">
      {mins < 60 ? `${mins}m waiting` : `${Math.floor(mins / 60)}h ${mins % 60}m waiting`}
    </Text>
  );
}

function QueueCard({
  ticket,
  onCallNext,
  onServe,
  onComplete,
  onNoShow,
}: {
  ticket: QueueTicket;
  onCallNext: () => void;
  onServe: () => void;
  onComplete: () => void;
  onNoShow: () => void;
}) {
  const isWaiting = ticket.status === "waiting";
  const isInService = ticket.status === "in_service";

  return (
    <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="bg-brand-gold/20 rounded-xl w-12 h-12 items-center justify-center">
            <Text className="text-brand-gold text-lg font-bold">#{ticket.queue_number}</Text>
          </View>
          <View>
            <Text className="text-white font-semibold text-base">
              {ticket.customer?.full_name ?? "Walk-in"}
            </Text>
            {ticket.customer?.phone && (
              <Text className="text-white/50 text-xs">{ticket.customer.phone}</Text>
            )}
          </View>
        </View>
        <Badge status={ticket.status} />
      </View>

      {ticket.service && (
        <Text className="text-white/60 text-sm mb-1">
          {ticket.service.name} · RM {ticket.service.price.toFixed(2)}
        </Text>
      )}
      {ticket.party_size > 1 && (
        <Text className="text-white/50 text-sm mb-1">Party of {ticket.party_size}</Text>
      )}
      <WaitTime createdAt={ticket.created_at} />

      <View className="flex-row gap-2 mt-3">
        {isWaiting && (
          <>
            <TouchableOpacity
              onPress={onCallNext}
              className="flex-1 bg-blue-700/20 border border-blue-700/30 rounded-xl py-2.5 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-blue-400 text-sm font-semibold">Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNoShow}
              className="flex-row items-center gap-1 px-3 py-2.5 bg-white/5 rounded-xl border border-white/10"
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={14} color="rgba(255,255,255,0.4)" />
              <Text className="text-white/40 text-sm">No Show</Text>
            </TouchableOpacity>
          </>
        )}
        {isInService && (
          <>
            <TouchableOpacity
              onPress={onComplete}
              className="flex-1 bg-emerald-700/20 border border-emerald-700/30 rounded-xl py-2.5 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-emerald-400 text-sm font-semibold">Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onServe}
              className="px-3 py-2.5 bg-white/5 rounded-xl border border-white/10"
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function AddWalkInModal({
  visible,
  onClose,
  tenantId,
  branchId,
}: {
  visible: boolean;
  onClose: () => void;
  tenantId: string;
  branchId: string;
}) {
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const services = useServices(tenantId);
  const { addWalkIn } = useQueueActions(tenantId, branchId);

  function handleAdd() {
    addWalkIn.mutate(
      {
        customerName: name.trim(),
        serviceId: selectedServiceId,
        partySize: Math.max(1, parseInt(partySize, 10) || 1),
      },
      {
        onSuccess: () => {
          setName("");
          setPartySize("1");
          setSelectedServiceId(null);
          onClose();
        },
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-brand-dark p-6 pt-8">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-xl font-bold">Add Walk-in</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <Text className="text-white/70 text-sm mb-1.5">Customer Name (optional)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter name…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3 text-white mb-4"
        />

        <Text className="text-white/70 text-sm mb-1.5">Party Size</Text>
        <TextInput
          value={partySize}
          onChangeText={setPartySize}
          keyboardType="number-pad"
          placeholder="1"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3 text-white mb-4"
        />

        <Text className="text-white/70 text-sm mb-2">Service (optional)</Text>
        <View className="gap-2 mb-6">
          {(services.data ?? []).slice(0, 8).map((svc) => (
            <TouchableOpacity
              key={svc.id}
              onPress={() => setSelectedServiceId(svc.id === selectedServiceId ? null : svc.id)}
              className={`flex-row items-center justify-between px-4 py-3 rounded-xl border ${
                selectedServiceId === svc.id
                  ? "border-brand-gold bg-brand-gold/10"
                  : "border-brand-border bg-brand-darkcard"
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white text-sm">{svc.name}</Text>
              <Text className="text-white/50 text-sm">RM {svc.price.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleAdd}
          disabled={addWalkIn.isPending}
          className={`bg-brand-gold rounded-xl py-4 items-center ${addWalkIn.isPending ? "opacity-60" : ""}`}
          activeOpacity={0.8}
        >
          <Text className="text-brand-dark font-bold text-base">
            {addWalkIn.isPending ? "Adding…" : "Add to Queue"}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function QueueScreen() {
  const { session } = useStaffSession();
  const [showAddModal, setShowAddModal] = useState(false);

  const tenantId = session?.tenantId ?? "";
  const branchId = session?.branchId ?? "";

  const { data: tickets, isLoading, refetch } = useQueueTickets(tenantId, branchId);
  const { updateStatus } = useQueueActions(tenantId, branchId);

  function handleStatusUpdate(ticketId: string, status: string, confirmMsg?: string) {
    const doUpdate = () =>
      updateStatus.mutate(
        { ticketId, status },
        { onError: (e) => Alert.alert("Error", e.message) }
      );

    if (confirmMsg) {
      Alert.alert("Confirm", confirmMsg, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: doUpdate },
      ]);
    } else {
      doUpdate();
    }
  }

  const waiting = (tickets ?? []).filter((t) => t.status === "waiting");
  const inService = (tickets ?? []).filter((t) => t.status === "in_service");

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-bold">Queue</Text>
          <Text className="text-white/50 text-sm">
            {waiting.length} waiting · {inService.length} in service
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          className="bg-brand-gold w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={22} color="#121212" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (tickets ?? []).length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Ionicons name="time-outline" size={48} color="rgba(255,255,255,0.2)" />
          <Text className="text-white/40 text-base">No customers in queue</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#D4AF37" />
          }
          renderItem={({ item }) => (
            <QueueCard
              ticket={item}
              onCallNext={() => handleStatusUpdate(item.id, "in_service")}
              onServe={() => handleStatusUpdate(item.id, "waiting")}
              onComplete={() =>
                handleStatusUpdate(item.id, "completed", "Mark this customer as completed?")
              }
              onNoShow={() =>
                handleStatusUpdate(item.id, "no_show", "Mark as no-show?")
              }
            />
          )}
        />
      )}

      <AddWalkInModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        tenantId={tenantId}
        branchId={branchId}
      />
    </SafeAreaView>
  );
}
