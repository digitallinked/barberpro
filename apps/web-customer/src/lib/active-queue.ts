export type ActiveQueueTicket = {
  ticketId: string;
  queueNumber: string;
  branchId: string;
  branchName: string;
  storedAt: number;
};

const STORAGE_KEY = "barberpro:active-queue";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/** Same-tab + cross-tab listeners (storage event) */
const CHANGE_EVENT = "barberpro:active-queue-changed";

function notifyActiveQueueChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Subscribe to localStorage active-queue changes (set, clear, other tabs). */
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

export function setActiveQueue(ticket: ActiveQueueTicket): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ticket));
    notifyActiveQueueChanged();
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

/**
 * Pure snapshot — no side effects.
 * Safe to call as the snapshot fn inside useSyncExternalStore.
 */
export function getActiveQueue(): ActiveQueueTicket | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const ticket = JSON.parse(raw) as ActiveQueueTicket;
    // Expired — treat as absent but do NOT call clearActiveQueue here
    // (that would be a side effect inside a snapshot → React infinite loop)
    if (Date.now() - ticket.storedAt > TTL_MS) return null;
    return ticket;
  } catch {
    return null;
  }
}

/**
 * Call this from effects / event handlers to lazily prune an expired entry.
 * Never call this from render or from inside useSyncExternalStore snapshot.
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

export function clearActiveQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyActiveQueueChanged();
  } catch {
    // Ignore
  }
}
