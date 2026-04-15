"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n/language-context";
import type { Translations } from "@/lib/i18n/translations";

type InstallState = "idle" | "prompt" | "manual" | "ios" | "installed";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type InstallInstructions = {
  label: string;
  steps: string[];
};

const DISMISSED_KEY = "pwa-install-dismissed";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function getInstallInstructions(t: Translations): InstallInstructions {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("edg/")) {
    return { label: t.pwa.browserEdge, steps: [t.pwa.edgeStep1, t.pwa.edgeStep2] };
  }
  if (ua.includes("chrome/") && !ua.includes("edg/")) {
    return { label: t.pwa.browserChrome, steps: [t.pwa.chromeStep1, t.pwa.chromeStep2] };
  }
  if (ua.includes("safari/") && !ua.includes("chrome/")) {
    return { label: t.pwa.browserSafari, steps: [t.pwa.safariStep1, t.pwa.safariStep2] };
  }
  return { label: t.pwa.browserGeneric, steps: [t.pwa.genericStep1, t.pwa.genericStep2] };
}

export function PwaInstallBanner() {
  const t = useT();
  const [state, setState] = useState<InstallState>("idle");
  const [showHelp, setShowHelp] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    if (isIos()) {
      setState("ios");
      return;
    }

    const manualFallbackTimer = window.setTimeout(() => {
      setState((current) => (current === "idle" ? "manual" : current));
    }, 1500);

    const handler = (e: Event) => {
      e.preventDefault();
      window.clearTimeout(manualFallbackTimer);
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setState("prompt");
    };

    const installedHandler = () => {
      window.clearTimeout(manualFallbackTimer);
      setState("installed");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.clearTimeout(manualFallbackTimer);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setState("idle");
  }

  async function install() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setState("installed");
    } else {
      dismiss();
    }
    deferredPrompt.current = null;
  }

  const instructions = (state === "manual" || state === "ios") ? getInstallInstructions(t) : null;

  if (state === "idle" || state === "installed") return null;

  return (
    <div
      role="dialog"
      aria-label={t.pwa.ariaLabel}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#1a1a1a] p-4 shadow-2xl shadow-black/60 backdrop-blur-md">

        {/* ── Header row: icon · title · dismiss ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15">
            <img src="/icon-192.png" alt="BarberPro" className="h-6 w-6 rounded-lg" />
          </div>

          <p className="flex-1 text-sm font-semibold leading-snug text-white">
            {t.pwa.title}
          </p>

          <button
            type="button"
            onClick={dismiss}
            aria-label={t.pwa.dismissAria}
            className="-mr-1 rounded-lg p-1.5 text-gray-500 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body: description + help — indented to align with title ── */}
        <div className="ml-12 mt-2 space-y-2">
          {state === "prompt" && (
            <p className="text-xs leading-snug text-gray-400">
              {t.pwa.promptDescription}
            </p>
          )}

          {state === "ios" && (
            <p className="text-xs leading-snug text-gray-400">
              {t.pwa.iosTapPrefix}{" "}
              <Share className="mx-0.5 inline h-3 w-3 text-gray-300" />{" "}
              <span className="font-medium text-gray-300">"{t.pwa.addToHomeScreen}"</span>.
            </p>
          )}

          {state === "manual" && (
            <p className="text-xs leading-snug text-gray-400">
              {t.pwa.manualPrefix}{" "}
              <span className="font-medium text-gray-300">"{t.pwa.installApp}"</span>{" "}
              {t.pwa.or}{" "}
              <span className="font-medium text-gray-300">"{t.pwa.addToHomeScreen}"</span>.
            </p>
          )}

          {showHelp && instructions && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white">
                {t.pwa.helpTitlePrefix} {instructions.label}
              </p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs leading-snug text-gray-300">
                {instructions.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Action button ── */}
          <div className="pt-0.5">
            {state === "prompt" && (
              <button
                type="button"
                onClick={install}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-[#111111] transition hover:brightness-110 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                {t.pwa.installApp}
              </button>
            )}

            {(state === "manual" || state === "ios") && (
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-medium text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                {showHelp ? t.pwa.hideHelp : t.pwa.howToInstall}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
