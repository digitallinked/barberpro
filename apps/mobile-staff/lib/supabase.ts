import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

function resolveUrlAndKey(): { url: string; key: string } {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  const url = (
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    extra?.supabaseUrl ??
    ""
  ).trim();
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    extra?.supabaseAnonKey ??
    ""
  ).trim();
  return { url, key };
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const { url, key } = resolveUrlAndKey();
  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Copy apps/mobile-staff/.env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (Supabase Dashboard → Settings → API)."
    );
  }
  client = createClient(url, key, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

/**
 * Lazy Supabase client so missing env does not throw when route modules load.
 * First real use (e.g. auth, queries) throws a clear setup error if `.env` is absent.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getClient();
    const value = Reflect.get(instance as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});
