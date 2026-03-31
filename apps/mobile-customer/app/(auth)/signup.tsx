import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router, Link } from "expo-router";

import { supabase } from "../../lib/supabase";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Signup Failed", error.message);
      return;
    }

    if (data.user) {
      await supabase.from("customer_accounts").insert({
        auth_user_id: data.user.id,
        full_name: name,
        email,
      });
    }

    router.replace("/(tabs)/home");
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>Create Account</Text>
      <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>Join BarberPro today</Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16 }}
      />

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
        onPress={handleSignup}
        disabled={loading}
        style={{ backgroundColor: "#1a1a2e", borderRadius: 8, padding: 16, alignItems: "center", opacity: loading ? 0.6 : 1 }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
          {loading ? "Creating account..." : "Create Account"}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: "#666" }}>
            Already have an account? <Text style={{ color: "#1a1a2e", fontWeight: "600" }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
