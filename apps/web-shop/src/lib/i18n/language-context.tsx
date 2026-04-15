"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { translations, type Language, type Translations } from "./translations";

export const STORAGE_KEY = "barberpro-lang";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Custom DOM event dispatched whenever the active language changes.
 * Components that live outside the React context tree (e.g. the global
 * PwaInstallBanner in the root layout) can listen to this event to stay
 * in sync with the innermost LanguageProvider without going through context.
 */
export const LANG_CHANGE_EVENT = "barberpro-lang-change";

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
};

const LanguageCtx = createContext<LanguageContextValue | null>(null);

function persistLanguage(lang: Language) {
  localStorage.setItem(STORAGE_KEY, lang);
  // Also write a cookie so the server can read the preference and render the
  // correct language on the first request, avoiding hydration mismatches.
  document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent<Language>(LANG_CHANGE_EVENT, { detail: lang }));
}

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: ReactNode;
}) {
  // Start with initialLanguage — this MUST match what the server rendered.
  // The root layout reads the language cookie and passes the correct value here,
  // so server and client always agree on first render (no hydration mismatch).
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    // On first mount, ensure localStorage and the cookie are written so future
    // server renders also get the right initialLanguage.
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (!stored) {
      persistLanguage(initialLanguage);
    }
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    persistLanguage(lang);
  }

  return (
    <LanguageCtx.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageCtx.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageCtx);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useT(): Translations {
  return useLanguage().t;
}
