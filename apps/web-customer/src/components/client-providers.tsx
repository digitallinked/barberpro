"use client";

import { type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/language-context";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
