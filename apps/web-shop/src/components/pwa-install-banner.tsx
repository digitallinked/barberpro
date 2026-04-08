"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type InstallState = "idle" | "prompt" | "ios" | "installed";

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

export function PwaInstallBanner() {
  const [state, setState] = useState<InstallState>("idle");
  const deferredPrompt = useRef<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    // Already installed — never show
    if (isInStandaloneMode()) return;

    // Already dismissed by user — never show again this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // iOS Safari — can't intercept install, show manual guide
    if (isIos()) {
      setState("ios");
      return;
    }

    // Desktop Chrome / Edge / Android Chrome — listen for browser prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as typeof deferredPrompt.current;
      setState("prompt");
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If already installed via a different path (e.g. browser bar)
    window.addEventListener("appinstalled", () => setState("installed"));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
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

  if (state === "idle" || state === "installed") return null;

  return (
    <div
      role="dialog"
      aria-label="Install BarberPro app"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#1a1a1a] p-4 shadow-2xl shadow-black/60 backdrop-blur-md">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15">
          <img src="/icon-192.png" alt="BarberPro" className="h-7 w-7 rounded-lg" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">
            Install BarberPro
          </p>
          {state === "prompt" && (
            <p className="mt-0.5 text-xs text-gray-400 leading-snug">
              Add to your home screen or desktop for faster access.
            </p>
          )}
          {state === "ios" && (
            <p className="mt-0.5 text-xs text-gray-400 leading-snug">
              Tap <Share className="inline h-3 w-3 mx-0.5 text-gray-300" /> then{" "}
              <span className="font-medium text-gray-300">"Add to Home Screen"</span>.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {state === "prompt" && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111111] transition hover:brightness-110 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-lg p-1.5 text-gray-500 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
