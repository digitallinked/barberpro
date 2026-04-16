"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";

const DISMISSED_KEY = "push-permission-dismissed";
const SUBSCRIBED_KEY = "push-subscribed";

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

async function subscribeAndSave(vapidPublicKey: string): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;

  // Check if already subscribed
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = subscription.toJSON();
  const keys = json.keys ?? {};

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh ?? "",
      auth: keys.auth ?? "",
    }),
  });

  return true;
}

type Props = {
  /** NEXT_PUBLIC_VAPID_PUBLIC_KEY — passed in from a server component/layout. */
  vapidPublicKey: string;
  /** Only show for authenticated users. */
  isLoggedIn: boolean;
};

export function PushPermissionPrompt({ vapidPublicKey, isLoggedIn }: Props) {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!isPushSupported()) return;
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;
    if (localStorage.getItem(SUBSCRIBED_KEY) === "1") return;
    if (Notification.permission === "granted") {
      // Already granted — silently subscribe without the prompt
      subscribeAndSave(vapidPublicKey)
        .then(() => localStorage.setItem(SUBSCRIBED_KEY, "1"))
        .catch(() => undefined);
      return;
    }
    if (Notification.permission === "denied") return;

    // Show prompt after a small delay so it doesn't interrupt page load
    timerRef.current = window.setTimeout(() => setVisible(true), 3000);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [isLoggedIn, vapidPublicKey]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function enable() {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribeAndSave(vapidPublicKey);
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      }
    } catch {
      // Permission denied or subscribe failed — silently dismiss
    } finally {
      setSubscribing(false);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Enable push notifications"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <div className="rounded-2xl border border-[#d4af37]/30 bg-[#111111] p-4 shadow-2xl shadow-black/60 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/15">
            <Bell className="h-4 w-4 text-[#d4af37]" />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Stay updated on your queue
            </p>
            <p className="mt-0.5 text-xs leading-snug text-gray-400">
              Get notified when it&apos;s almost your turn — even when the tab
              is closed.
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-500 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-12 mt-3 flex gap-2">
          <button
            type="button"
            onClick={enable}
            disabled={subscribing}
            className="flex-1 rounded-lg bg-[#d4af37] py-2 text-xs font-bold text-[#111111] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {subscribing ? "Enabling…" : "Enable notifications"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 transition hover:text-white"
          >
            <BellOff className="h-3.5 w-3.5" />
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
