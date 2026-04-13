import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useStaffSession } from "../../contexts/staff-session";

export default function StaffLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useStaffSession();

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error.message);
      return;
    }

    await refresh();
    router.replace("/(tabs)/home");
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-10">
            <Text className="text-brand-gold text-4xl font-bold">BarberPro</Text>
            <Text className="text-white text-2xl font-semibold mt-1">Staff</Text>
            <Text className="text-white/50 mt-2 text-base">Sign in to your staff account</Text>
          </View>

          <View className="gap-3">
            <View>
              <Text className="text-white/70 text-sm mb-1.5 ml-1">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="staff@example.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3.5 text-white text-base"
              />
            </View>

            <View>
              <Text className="text-white/70 text-sm mb-1.5 ml-1">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                autoComplete="password"
                className="bg-brand-darkcard border border-brand-border rounded-xl px-4 py-3.5 text-white text-base"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`bg-brand-gold rounded-xl py-4 items-center mt-3 ${loading ? "opacity-60" : ""}`}
              activeOpacity={0.8}
            >
              <Text className="text-brand-dark font-bold text-base">
                {loading ? "Signing in…" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
