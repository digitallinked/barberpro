export type ActiveQueueTicket = {
  ticketId: string;
  queueNumber: string;
  branchId: string;
  branchName: string;
  storedAt: number;
};

const STORAGE_KEY = "barberpro:active-queue";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function setActiveQueue(ticket: ActiveQueueTicket): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ticket));
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

export function getActiveQueue(): ActiveQueueTicket | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const ticket = JSON.parse(raw) as ActiveQueueTicket;
    if (Date.now() - ticket.storedAt > TTL_MS) {
      clearActiveQueue();
      return null;
    }
    return ticket;
  } catch {
    return null;
  }
}

export function clearActiveQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
