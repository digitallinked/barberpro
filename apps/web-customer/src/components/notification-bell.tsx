"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@barberpro/notifications";

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function categoryDot(category: NotificationRow["category"]): string {
  switch (category) {
    case "queue_alert": return "bg-amber-400";
    case "booking": return "bg-blue-400";
    case "payment": return "bg-emerald-400";
    case "reminder": return "bg-purple-400";
    default: return "bg-gray-400";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadIds.length > 0) {
      const t = setTimeout(() => markRead(unreadIds), 1200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleNotificationClick(n: NotificationRow) {
    if (!n.is_read) markRead([n.id]);
    if (n.action_url) {
      router.push(n.action_url);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:border-white/20 hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#d4af37] text-[9px] font-bold leading-none text-[#111111]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "z-[60] rounded-xl border border-white/10 bg-[#161a1f] shadow-2xl shadow-black/60",
            "max-sm:fixed max-sm:inset-x-4 max-sm:top-[4.75rem] max-sm:w-auto max-sm:max-h-[min(520px,calc(100dvh-5.5rem))]",
            "sm:absolute sm:right-0 sm:top-full sm:z-50 sm:mt-2 sm:w-80",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  title="Mark all read"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition hover:text-white"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  All read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-gray-500 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(400px,calc(100dvh-10rem))] overflow-y-auto sm:max-h-[400px]">
            {isLoading && (
              <div className="py-8 text-center text-xs text-gray-500">Loading…</div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-500">
                No notifications yet
              </div>
            )}

            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNotificationClick(n)}
                className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                  n.is_read ? "opacity-60" : ""
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${categoryDot(n.category)}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-xs font-semibold leading-snug text-white">
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="mt-0.5 shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#d4af37]">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-400">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-600">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-white/5 px-4 py-2.5 text-center">
              <span className="text-[10px] text-gray-600">
                Last {notifications.length} notification
                {notifications.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
