"use client";

import { useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function useSupabase() {
  return useMemo(() => createBrowserSupabaseClient(), []);
}
