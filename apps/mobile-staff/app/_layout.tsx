import "../global.css";

import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import type { ErrorBoundaryProps } from "expo-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import { StaffSessionProvider } from "../contexts/staff-session";
import { setupNotificationHandler } from "../lib/notifications";

setupNotificationHandler().catch((err) => {
  if (__DEV__) console.warn("[notifications] setup failed:", err);
});

/** Shown when an uncaught render error crashes the app */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
        Something went wrong
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
        {error.message}
      </Text>
      <TouchableOpacity
        onPress={retry}
        style={{ backgroundColor: "#D4AF37", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
      >
        <Text style={{ color: "#121212", fontWeight: "bold" }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

async function checkForOtaUpdate() {
  if (__DEV__) return;
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // OTA check is non-critical; app continues with current bundle
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60_000,
      gcTime: 24 * 60 * 60_000,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  useEffect(() => { checkForOtaUpdate(); }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
      >
        <StaffSessionProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(manager)" />
          </Stack>
        </StaffSessionProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
