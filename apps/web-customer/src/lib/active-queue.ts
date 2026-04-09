export type ActiveQueueTicket = {
  ticketId: string;
  queueNumber: string;
  branchId: string;
  branchName: string;
  storedAt: number;
};

const STORAGE_KEY = "barberpro:active-queue";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const CHANGE_EVENT = "barberpro:active-queue-changed";

// ─── Stable snapshot cache ────────────────────────────────────────────────────
// useSyncExternalStore compares snapshots with Object.is.
// JSON.parse produces a new object every call, which would always look
// "changed" and cause an infinite re-render loop (React error #185).
// We cache by raw JSON string: same string → same object reference.
let _cachedRaw: string | null = null;
let _cachedTicket: ActiveQueueTicket | null = null;

function invalidateCache(): void {
  _cachedRaw = null;
  _cachedTicket = null;
}

// ─── Notification helpers ─────────────────────────────────────────────────────

function notifyActiveQueueChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Subscribe to active-queue changes (same tab + cross-tab via storage event).
 * Stable function reference — safe to pass directly to useSyncExternalStore.
 */
export function subscribeActiveQueue(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Pure snapshot — no side effects, stable reference when data hasn't changed.
 * Safe to pass as the getSnapshot argument to useSyncExternalStore.
 */
export function getActiveQueue(): ActiveQueueTicket | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      invalidateCache();
      return null;
    }

    // Return the cached object when the raw JSON is unchanged
    // so Object.is comparisons in useSyncExternalStore stay true.
    if (raw === _cachedRaw) return _cachedTicket;

    const ticket = JSON.parse(raw) as ActiveQueueTicket;

    // Expired — treat as absent (side-effect free; caller prunes separately)
    if (Date.now() - ticket.storedAt > TTL_MS) {
      invalidateCache();
      return null;
    }

    _cachedRaw = raw;
    _cachedTicket = ticket;
    return ticket;
  } catch {
    return null;
  }
}

/**
 * Prune an expired entry from storage.
 * Call only from effects / event handlers — never during render.
 */
export function pruneExpiredActiveQueue(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const ticket = JSON.parse(raw) as ActiveQueueTicket;
    if (Date.now() - ticket.storedAt > TTL_MS) clearActiveQueue();
  } catch {
    // ignore
  }
}

export function setActiveQueue(ticket: ActiveQueueTicket): void {
  try {
    invalidateCache();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ticket));
    notifyActiveQueueChanged();
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

export function clearActiveQueue(): void {
  try {
    invalidateCache();
    localStorage.removeItem(STORAGE_KEY);
    notifyActiveQueueChanged();
  } catch {
    // Ignore
  }
}
