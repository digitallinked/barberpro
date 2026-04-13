import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic Expo config: merges `app.json` with env-driven `extra` for Supabase.
 * EAS / `expo start` load `.env`; `EXPO_PUBLIC_*` are inlined into the JS bundle.
 */
export default ({ config }: ConfigContext) =>
  ({
    ...config,
    extra: {
      ...config.extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    },
  }) as ExpoConfig;
