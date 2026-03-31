import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

import { supabase } from "../../lib/supabase";

export default function ScheduleScreen() {
  const [staffName, setStaffName] = useState("");
  const today = new Date().toLocaleDateString("en-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setStaffName(user?.user_metadata?.full_name || "Staff");
    });
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Hey, {staffName}!</Text>
      <Text style={{ color: "#666", marginTop: 4 }}>{today}</Text>

      <View style={{ marginTop: 24, borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Today&apos;s Appointments</Text>
        <Text style={{ color: "#999", marginTop: 8 }}>No appointments scheduled</Text>
      </View>

      <TouchableOpacity style={{ marginTop: 16, backgroundColor: "#1a1a2e", borderRadius: 12, padding: 16, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Clock In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
