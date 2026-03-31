import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";

import { supabase } from "../../lib/supabase";

export default function StaffLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error.message);
      return;
    }

    router.replace("/(tabs)/schedule");
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>BarberPro Staff</Text>
      <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>Sign in with your staff account</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 24, fontSize: 16 }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{ backgroundColor: "#1a1a2e", borderRadius: 8, padding: 16, alignItems: "center", opacity: loading ? 0.6 : 1 }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
