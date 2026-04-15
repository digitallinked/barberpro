"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-[11px] font-bold">
      <button
        type="button"
        onClick={() => setLanguage("ms")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          language === "ms"
            ? "bg-[#D4AF37] text-black"
            : "text-gray-400 hover:text-white"
        }`}
      >
        BM
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          language === "en"
            ? "bg-[#D4AF37] text-black"
            : "text-gray-400 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
