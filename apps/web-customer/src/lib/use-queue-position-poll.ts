"use client";

import { useEffect } from "react";

/** HTTP fallback when Supabase Realtime WebSocket is blocked (extensions, firewalls). */
export const QUEUE_POSITION_POLL_MS = 12_000;

type Options = {
  /** When false, the interval is not started. */
  enabled?: boolean;
};

/**
 * Polls queue position on an interval while `enabled`. Skips ticks when the tab is hidden;
 * refetches when the tab becomes visible again.
 */
export function useQueuePositionPoll(fetchPosition: () => void | Promise<void>, options?: Options) {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void fetchPosition();
    };

    const id = window.setInterval(tick, QUEUE_POSITION_POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchPosition();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchPosition, enabled]);
}
