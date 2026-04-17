"use client";

/**
 * Intermediate SSO handoff page.
 *
 * Flow:
 *  1. shop-access.ts generates a magic link with redirectTo = barberpro.my/auth/shop-handoff
 *  2. Supabase verifies the OTP and redirects here with tokens in the URL hash
 *     (#access_token=...&refresh_token=...&type=magiclink)
 *  3. This page reads the hash tokens and immediately navigates the browser to
 *     shop.barberpro.my/auth/set-session with the same hash, where the shop app
 *     calls supabase.auth.setSession() to establish a cookie session.
 *
 * Using barberpro.my as the intermediate domain avoids the Supabase redirect URL
 * allowlist requirement — any path on the configured site URL is auto-allowed.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function ShopHandoffPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading '#'

    if (!hash) {
      setError("No session data received. Please try again.");
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("Session tokens missing. Please try again.");
      return;
    }

    const shopBase =
      (process.env.NEXT_PUBLIC_SHOP_APP_URL ?? "https://shop.barberpro.my").replace(/\/$/, "");

    // Forward the tokens to the shop app. Hash params are never sent to the
    // server so they won't appear in access logs on either domain.
    window.location.replace(`${shopBase}/auth/set-session#${hash}`);
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <div className="space-y-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <Link
            href="/"
            className="block text-sm text-[#d4af37] underline-offset-4 hover:underline"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        <p className="text-sm text-gray-400">Opening your shop dashboard…</p>
      </div>
    </div>
  );
}
