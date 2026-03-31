import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";

import { supabase } from "../../lib/supabase";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<{
    full_name: string;
    email: string | null;
    loyalty_points: number;
  } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("customer_accounts")
        .select("full_name, email, loyalty_points")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      setProfile(data);
    }
    fetchProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Profile</Text>

      {profile && (
        <View style={{ marginTop: 24 }}>
          <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{profile.full_name}</Text>
            <Text style={{ color: "#666", marginTop: 4 }}>{profile.email}</Text>
          </View>

          <View style={{ backgroundColor: "#f8f9fa", borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 40, fontWeight: "bold" }}>{profile.loyalty_points}</Text>
            <Text style={{ color: "#666", marginTop: 4 }}>Loyalty Points</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={() => Alert.alert("Sign Out", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: handleLogout },
        ])}
        style={{ borderWidth: 1, borderColor: "#e00", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 }}
      >
        <Text style={{ color: "#e00", fontSize: 16, fontWeight: "600" }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
