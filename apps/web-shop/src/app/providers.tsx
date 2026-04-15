"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { LanguageProvider } from "@/lib/i18n/language-context";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
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
      <LanguageProvider initialLanguage="ms">
        {children}
        <CookieConsentBanner />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
