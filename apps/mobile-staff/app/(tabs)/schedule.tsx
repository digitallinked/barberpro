import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { useStaffSession } from "../../contexts/staff-session";
import { useAppointments, useAppointmentActions, type Appointment } from "../../hooks/use-appointments";
import { Badge } from "../../components/ui/badge";
import { isOwnerOrManager } from "../../lib/permissions";

function DayPicker({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <View className="flex-row gap-2 px-5 py-3">
      {days.map((day) => {
        const active = isSameDay(day, selected);
        return (
          <TouchableOpacity
            key={day.toISOString()}
            onPress={() => onSelect(day)}
            className={`flex-1 items-center py-2.5 rounded-xl border ${
              active
                ? "bg-brand-gold/20 border-brand-gold"
                : "bg-brand-darkcard border-brand-border"
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs mb-1 ${active ? "text-brand-gold" : "text-white/40"}`}
            >
              {format(day, "EEE")}
            </Text>
            <Text
              className={`text-sm font-bold ${active ? "text-brand-gold" : "text-white"}`}
            >
              {format(day, "d")}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const STATUS_ACTIONS: Record<string, string[]> = {
  booked: ["confirmed", "cancelled"],
  confirmed: ["in_service", "cancelled"],
  in_service: ["completed", "no_show"],
};

function AppointmentCard({
  appointment,
  onStatusChange,
  canEdit,
}: {
  appointment: Appointment;
  onStatusChange: (status: string) => void;
  canEdit: boolean;
}) {
  const actions = STATUS_ACTIONS[appointment.status] ?? [];

  return (
    <View className="bg-brand-darkcard border border-brand-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-white font-semibold text-base">
            {appointment.customer?.full_name ?? "Customer"}
          </Text>
          {appointment.customer?.phone && (
            <Text className="text-white/50 text-xs">{appointment.customer.phone}</Text>
          )}
        </View>
        <Badge status={appointment.status} />
      </View>

      <View className="flex-row items-center gap-3 mb-2">
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.4)" />
          <Text className="text-white/60 text-sm">
            {format(parseISO(appointment.start_at), "h:mm a")}
          </Text>
        </View>
        {appointment.service && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="cut-outline" size={14} color="rgba(255,255,255,0.4)" />
            <Text className="text-white/60 text-sm">{appointment.service.name}</Text>
          </View>
        )}
      </View>

      {appointment.barber && (
        <Text className="text-white/40 text-xs mb-2">
          Barber: {appointment.barber.full_name}
        </Text>
      )}

      {appointment.notes && (
        <Text className="text-white/40 text-xs mb-3 italic">{appointment.notes}</Text>
      )}

      {canEdit && actions.length > 0 && (
        <View className="flex-row gap-2">
          {actions.map((action) => (
            <TouchableOpacity
              key={action}
              onPress={() => {
                Alert.alert("Update Status", `Change to "${action}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Update", onPress: () => onStatusChange(action) },
                ]);
              }}
              className="flex-1 py-2 rounded-lg border border-brand-border bg-white/5 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white/70 text-xs font-medium capitalize">{action.replace("_", " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ScheduleScreen() {
  const { session } = useStaffSession();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isManager = session ? isOwnerOrManager(session.role) : false;

  const { data: appointments, isLoading, refetch } = useAppointments(
    session?.tenantId ?? "",
    session?.branchId ?? "",
    isManager ? null : undefined
  );
  const { updateStatus } = useAppointmentActions(session?.tenantId ?? "");

  const filtered = (appointments ?? []).filter((apt) =>
    isSameDay(parseISO(apt.start_at), selectedDate)
  );

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Schedule</Text>
        <Text className="text-white/50 text-sm">
          {format(selectedDate, "EEEE, d MMMM yyyy")}
        </Text>
      </View>

      <DayPicker selected={selectedDate} onSelect={setSelectedDate} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.2)" />
          <Text className="text-white/40 text-base">No appointments today</Text>
        </View>
      ) : (
        <FlatList
          data={filtered.sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#D4AF37" />
          }
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              canEdit={isManager || item.barber_staff_id === null}
              onStatusChange={(status) =>
                updateStatus.mutate(
                  { appointmentId: item.id, status },
                  { onError: (e) => Alert.alert("Error", e.message) }
                )
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
