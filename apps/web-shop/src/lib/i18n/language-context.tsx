"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { translations, type Language, type Translations } from "./translations";

const STORAGE_KEY = "barberpro-lang";

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

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: ReactNode;
}) {
  // Read localStorage synchronously on first render to avoid a language flash.
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === "ms" || stored === "en") return stored;
    }
    return initialLanguage;
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === "ms" || stored === "en") {
      // A user preference already exists — honour it.
      if (stored !== language) setLanguageState(stored);
    } else {
      // No preference stored yet (first-time user or cleared storage).
      // Persist this provider's initial language and notify any out-of-tree
      // listeners (e.g. PwaInstallBanner) so they can update immediately.
      localStorage.setItem(STORAGE_KEY, initialLanguage);
      window.dispatchEvent(
        new CustomEvent<Language>(LANG_CHANGE_EVENT, { detail: initialLanguage })
      );
    }
    // Only run once on mount — initialLanguage is stable from the server render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Notify global listeners that sit outside the React context tree.
    window.dispatchEvent(
      new CustomEvent<Language>(LANG_CHANGE_EVENT, { detail: lang })
    );
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
