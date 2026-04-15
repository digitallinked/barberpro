"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

import { useT } from "@/lib/i18n/language-context";

const CONSENT_KEY = "barberpro-cookie-consent";

export function CookieConsentBanner() {
  const t = useT();
  const tc = t.cookies;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={tc.ariaLabel}
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
    >
      <div className="mx-auto max-w-5xl rounded-2xl border border-[#D4AF37]/20 bg-[#111111]/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-md lg:flex lg:items-center lg:gap-6 lg:p-5">

        {/* Icon + message */}
        <div className="flex flex-1 items-start gap-3 lg:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15">
            <Cookie className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <p className="text-sm leading-snug text-gray-300">
            {tc.message}{" "}
            <a
              href="/privacy"
              className="font-medium text-[#D4AF37] underline-offset-2 hover:underline"
            >
              {tc.learnMore}
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 lg:mt-0 lg:shrink-0">
          <button
            type="button"
            onClick={decline}
            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white lg:flex-none"
          >
            {tc.decline}
          </button>
          <button
            type="button"
            onClick={accept}
            className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111111] transition hover:brightness-110 active:scale-95 lg:flex-none"
          >
            {tc.acceptAll}
          </button>
          <button
            type="button"
            onClick={decline}
            aria-label={tc.decline}
            className="rounded-lg p-2 text-gray-500 transition hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
