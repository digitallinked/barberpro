"use client";

import { type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <CookieConsentBanner />
    </LanguageProvider>
  );
}
