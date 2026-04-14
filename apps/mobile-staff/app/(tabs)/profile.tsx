import { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useStaffSession } from "../../contexts/staff-session";
import { supabase } from "../../lib/supabase";
import { getRoleLabel } from "../../lib/permissions";

type Language = { code: string; label: string; native: string };

const LANGUAGES: Language[] = [
  { code: "en", label: "English", native: "English" },
  { code: "ms", label: "Malay", native: "Bahasa Malaysia" },
  { code: "zh", label: "Chinese", native: "中文" },
];

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3.5 border-b border-brand-border">
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.4)" />
      <View className="flex-1">
        <Text className="text-white/50 text-xs">{label}</Text>
        <Text className="text-white text-sm mt-0.5">{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { session, clearSession } = useStaffSession();
  const [selectedLang, setSelectedLang] = useState("en");

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="flex-1 px-5 pt-4">
        <Text className="text-white text-2xl font-bold mb-6">Profile</Text>

        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="bg-brand-gold/20 border-2 border-brand-gold rounded-full w-20 h-20 items-center justify-center mb-3">
            <Text className="text-brand-gold text-3xl font-bold">
              {session.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">{session.fullName}</Text>
          <View className="bg-brand-gold/10 border border-brand-gold/30 rounded-full px-3 py-0.5 mt-1">
            <Text className="text-brand-gold text-xs font-semibold">
              {getRoleLabel(session.role)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 mb-4">
          {session.email && (
            <ProfileRow icon="mail-outline" label="Email" value={session.email} />
          )}
          {session.phone && (
            <ProfileRow icon="call-outline" label="Phone" value={session.phone} />
          )}
          <ProfileRow icon="business-outline" label="Branch" value={session.branchId} />
        </View>

        {/* Language */}
        <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 py-3 mb-4">
          <Text className="text-white/60 text-sm mb-3">Language</Text>
          <View className="flex-row gap-2">
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setSelectedLang(lang.code)}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  selectedLang === lang.code
                    ? "border-brand-gold bg-brand-gold/10"
                    : "border-brand-border"
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedLang === lang.code ? "text-brand-gold" : "text-white/50"
                  }`}
                >
                  {lang.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App info */}
        <View className="bg-brand-darkcard border border-brand-border rounded-2xl px-4 mb-4">
          <ProfileRow
            icon="information-circle-outline"
            label="Version"
            value={Constants.expoConfig?.version ?? "1.0.0"}
          />
          <View className="flex-row items-center gap-3 py-3.5">
            <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.4)" />
            <Text className="text-white/50 text-sm">Secured by BarberPro</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 py-4 bg-red-700/10 border border-red-700/30 rounded-2xl"
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text className="text-red-400 font-semibold">Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
