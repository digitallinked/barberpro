"use client";

/**
 * Shop SSO session receiver.
 *
 * Receives session tokens forwarded from barberpro.my/auth/shop-handoff in the
 * URL hash, calls supabase.auth.setSession() to write the cookie-based session,
 * then redirects to /dashboard. The middleware handles the branch-scoped redirect.
 *
 * Hash params are never sent to the server, so tokens are not exposed in logs.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createBrowserClient } from "@/lib/supabase/client";

export default function SetSessionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);

    if (!hash) {
      setError("No session data received.");
      return;
    }

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setError("Invalid session tokens.");
      return;
    }

    const supabase = createBrowserClient();
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          console.error("[set-session] setSession failed:", sessionError.message);
          setError("Failed to sign in. Please try again.");
        } else {
          // Let the middleware handle routing to the right branch dashboard
          router.replace("/dashboard");
        }
      });
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <div className="space-y-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <a
            href="/login"
            className="block text-sm text-[#d4af37] underline-offset-4 hover:underline"
          >
            Sign in to shop dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        <p className="text-sm text-gray-400">Signing in to your shop dashboard…</p>
      </div>
    </div>
  );
}
