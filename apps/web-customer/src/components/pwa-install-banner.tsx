"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n/language-context";

type InstallState = "idle" | "prompt" | "manual" | "ios" | "installed";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type InstallInstructions = { label: string; steps: string[] };

const DISMISSED_KEY = "pwa-install-dismissed-customer";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function PwaInstallBanner() {
  const t = useT();
  const tp = t.pwa;
  const [state, setState] = useState<InstallState>("idle");
  const [showHelp, setShowHelp] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const manualFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function isDismissed(): boolean {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    if (isInStandaloneMode()) return;
    if (isDismissed()) return;

    if (isIos()) {
      setState("ios");
      return;
    }

    manualFallbackTimerRef.current = window.setTimeout(() => {
      manualFallbackTimerRef.current = null;
      if (isDismissed()) return;
      setState((current) => (current === "idle" ? "manual" : current));
    }, 1500);

    const handler = (e: Event) => {
      if (isDismissed()) return;
      e.preventDefault();
      if (manualFallbackTimerRef.current !== null) {
        window.clearTimeout(manualFallbackTimerRef.current);
        manualFallbackTimerRef.current = null;
      }
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setState("prompt");
    };

    const installedHandler = () => {
      if (manualFallbackTimerRef.current !== null) {
        window.clearTimeout(manualFallbackTimerRef.current);
        manualFallbackTimerRef.current = null;
      }
      setState("installed");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      if (manualFallbackTimerRef.current !== null) {
        window.clearTimeout(manualFallbackTimerRef.current);
        manualFallbackTimerRef.current = null;
      }
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    if (manualFallbackTimerRef.current !== null) {
      window.clearTimeout(manualFallbackTimerRef.current);
      manualFallbackTimerRef.current = null;
    }
    setState("idle");
  }

  async function install() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") setState("installed");
    else dismiss();
    deferredPrompt.current = null;
  }

  function getInstructions(): InstallInstructions {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg/")) return { label: tp.browserEdge, steps: [tp.edgeStep1, tp.edgeStep2] };
    if (ua.includes("chrome/") && !ua.includes("edg/")) return { label: tp.browserChrome, steps: [tp.chromeStep1, tp.chromeStep2] };
    if (ua.includes("safari/") && !ua.includes("chrome/")) return { label: tp.browserSafari, steps: [tp.safariStep1, tp.safariStep2] };
    return { label: tp.browserGeneric, steps: [tp.genericStep1, tp.genericStep2] };
  }

  const instructions = (state === "manual" || state === "ios") ? getInstructions() : null;

  if (state === "idle" || state === "installed") return null;

  return (
    <div
      role="dialog"
      aria-label={tp.ariaLabel}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4 shadow-2xl shadow-black/60 backdrop-blur-md">

        {/* ── Header: icon · title · dismiss ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15">
            <img src="/icon-192.png" alt="BarberPro" className="h-6 w-6 rounded-lg" />
          </div>

          <p className="flex-1 text-sm font-semibold leading-snug text-white">
            {tp.title}
          </p>

          <button
            type="button"
            onClick={dismiss}
            aria-label={tp.dismissAria}
            className="-mr-1 rounded-lg p-1.5 text-gray-500 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body: description + help (indented to align with title) ── */}
        <div className="ml-12 mt-2 space-y-2">
          {state === "prompt" && (
            <p className="text-xs leading-snug text-gray-400">{tp.promptDescription}</p>
          )}

          {state === "ios" && (
            <p className="text-xs leading-snug text-gray-400">
              {tp.iosTapPrefix}{" "}
              <Share className="mx-0.5 inline h-3 w-3 text-gray-300" />{" "}
              <span className="font-medium text-gray-300">"{tp.addToHomeScreen}"</span>.
            </p>
          )}

          {state === "manual" && (
            <p className="text-xs leading-snug text-gray-400">
              {tp.manualPrefix}{" "}
              <span className="font-medium text-gray-300">"{tp.installApp}"</span>{" "}
              {tp.or}{" "}
              <span className="font-medium text-gray-300">"{tp.addToHomeScreen}"</span>.
            </p>
          )}

          {showHelp && instructions && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white">
                {tp.helpTitlePrefix} {instructions.label}
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
                {tp.installApp}
              </button>
            )}

            {(state === "manual" || state === "ios") && (
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-medium text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                {showHelp ? tp.hideHelp : tp.howToInstall}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
