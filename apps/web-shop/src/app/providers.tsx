"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { LanguageProvider } from "@/lib/i18n/language-context";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import type { Language } from "@/lib/i18n/translations";

type ProvidersProps = {
  children: ReactNode;
  initialLanguage: Language;
};

export function Providers({ children, initialLanguage }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider initialLanguage={initialLanguage}>
        {children}
        <CookieConsentBanner />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
