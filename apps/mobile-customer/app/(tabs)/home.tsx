import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import { supabase } from "../../lib/supabase";

export default function HomeScreen() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(user?.user_metadata?.full_name || "there");
    });
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Hey, {userName}!</Text>
      <Text style={{ fontSize: 16, color: "#666", marginTop: 4 }}>Ready for a fresh cut?</Text>

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/discover")}
        style={{ backgroundColor: "#1a1a2e", borderRadius: 12, padding: 20, marginTop: 24 }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Find a Barbershop</Text>
        <Text style={{ color: "#999", marginTop: 4 }}>Browse shops near you</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>Quick Actions</Text>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/bookings")}
          style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16, marginBottom: 8 }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>My Bookings</Text>
          <Text style={{ color: "#666", marginTop: 2 }}>View upcoming appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16 }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Loyalty Points</Text>
          <Text style={{ color: "#666", marginTop: 2 }}>Check your rewards balance</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
