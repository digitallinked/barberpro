"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

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
            staleTime: 5 * 60 * 1000,   // 5 min — sane default; overridden per-hook
            gcTime: 10 * 60 * 1000,      // keep inactive data 10 min before GC
            refetchOnWindowFocus: false,
            refetchOnMount: false,        // rely on staleTime, not mount events
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CookieConsentBanner />
    </QueryClientProvider>
  );
}
