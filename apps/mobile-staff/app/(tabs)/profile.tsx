import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";

import { supabase } from "../../lib/supabase";

export default function StaffProfileScreen() {
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Profile</Text>

      <TouchableOpacity
        onPress={() => Alert.alert("Sign Out", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: handleLogout },
        ])}
        style={{ borderWidth: 1, borderColor: "#e00", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 32 }}
      >
        <Text style={{ color: "#e00", fontSize: 16, fontWeight: "600" }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
