"use client";

import { useEffect } from "react";

/**
 * Safety net for Supabase implicit-flow links.
 *
 * If a magic link ever lands on "/" with hash tokens (e.g. #access_token=...),
 * immediately forward to /auth/shop-handoff preserving the hash so the normal
 * cross-domain handoff can continue.
 */
export function AuthHashHandoff() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const hasSupabaseTokens =
      Boolean(params.get("access_token")) &&
      Boolean(params.get("refresh_token")) &&
      (params.get("type") === "magiclink" || params.get("token_type") === "bearer");

    if (!hasSupabaseTokens) return;
    if (window.location.pathname === "/auth/shop-handoff") return;

    window.location.replace(`/auth/shop-handoff#${hash}`);
  }, []);

  return null;
}
