"use client";

import Link from "next/link";
import { Home } from "lucide-react";

import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

export function AuthPageHeader() {
  const { t } = useLanguage();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">{t.auth.backToHome}</span>
      </Link>

      <LanguageSwitcher />
    </header>
  );
}
