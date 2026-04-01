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

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
};

const LanguageCtx = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("ms");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === "ms" || stored === "en") {
      setLanguageState(stored);
    }
    // Update the html lang attribute to match the language
    document.documentElement.lang = stored === "en" ? "en" : "ms";
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
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
