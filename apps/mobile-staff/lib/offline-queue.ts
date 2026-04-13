import { storage } from "./storage";
import { supabase } from "./supabase";
import { malaysiaDateString } from "./malaysia-date";

const QUEUE_KEY = "offline_mutations";

// --- Types ---

export type QueueUpdatePayload = {
  ticketId: string;
  status: string;
  tenantId: string;
};

export type QueueWalkInPayload = {
  customerName: string;
  serviceId: string | null;
  partySize: number;
  tenantId: string;
  branchId: string;
};

export type PosTransactionPayload = {
  cart: Array<{
    serviceId: string | null;
    inventoryItemId: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
    itemType: "service" | "product";
  }>;
  paymentMethod: string;
  customerId?: string | null;
  discountAmount?: number;
  tenantId: string;
  branchId: string;
  appUserId: string;
};

export type PendingMutation =
  | { id: string; type: "queue_update"; payload: QueueUpdatePayload; createdAt: string }
  | { id: string; type: "queue_walkin"; payload: QueueWalkInPayload; createdAt: string }
  | { id: string; type: "pos_transaction"; payload: PosTransactionPayload; createdAt: string };

// --- Storage helpers ---

async function readQueue(): Promise<PendingMutation[]> {
  try {
    const raw = await storage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingMutation[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingMutation[]): Promise<void> {
  await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueMutation(mutation: Omit<PendingMutation, "id" | "createdAt">): Promise<void> {
  const queue = await readQueue();
  const entry: PendingMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  } as PendingMutation;
  await writeQueue([...queue, entry]);
}

export async function getPendingCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

// --- Replay ---

async function replayQueueUpdate(payload: QueueUpdatePayload): Promise<void> {
  const updates: Record<string, unknown> = { status: payload.status };
  if (payload.status === "in_service") updates.called_at = new Date().toISOString();
  if (payload.status === "completed") updates.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("queue_tickets")
    .update(updates)
    .eq("id", payload.ticketId)
    .eq("tenant_id", payload.tenantId);
  if (error) throw new Error(error.message);
}

async function replayQueueWalkIn(payload: QueueWalkInPayload): Promise<void> {
  const queueDay = malaysiaDateString();

  const { count } = await supabase
    .from("queue_tickets")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", payload.branchId)
    .eq("queue_day", queueDay);

  const queueNumber = String((count ?? 0) + 1).padStart(3, "0");

  const { error } = await supabase.from("queue_tickets").insert({
    tenant_id: payload.tenantId,
    branch_id: payload.branchId,
    queue_number: queueNumber,
    queue_day: queueDay,
    status: "waiting",
    service_id: payload.serviceId,
    party_size: payload.partySize,
    source: "staff_mobile",
    ...(payload.customerName ? { notes: payload.customerName } : {}),
  });
  if (error) throw new Error(error.message);
}

async function replayPosTransaction(payload: PosTransactionPayload): Promise<void> {
  const subtotal = payload.cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = payload.discountAmount ?? 0;
  const totalAmount = Math.max(0, subtotal - discount);

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      tenant_id: payload.tenantId,
      branch_id: payload.branchId,
      customer_id: payload.customerId ?? null,
      payment_method: payload.paymentMethod,
      payment_status: "paid",
      subtotal,
      tax_amount: 0,
      discount_amount: discount,
      total_amount: totalAmount,
      paid_at: new Date().toISOString(),
      created_by: payload.appUserId,
    })
    .select("id")
    .single();

  if (txnError || !txn) throw new Error(txnError?.message ?? "Failed to create transaction");

  const items = payload.cart.map((item) => ({
    transaction_id: txn.id,
    tenant_id: payload.tenantId,
    name: item.name,
    item_type: item.itemType,
    service_id: item.serviceId ?? null,
    inventory_item_id: item.inventoryItemId ?? null,
    staff_id: payload.appUserId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.unitPrice * item.quantity,
  }));

  const { error: itemsError } = await supabase.from("transaction_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);
}

/**
 * Replay all queued mutations in order. Failed mutations remain in the queue.
 * Returns the number of successfully replayed mutations.
 */
export async function replayOfflineQueue(): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const failed: PendingMutation[] = [];
  let succeeded = 0;

  for (const mutation of queue) {
    try {
      if (mutation.type === "queue_update") await replayQueueUpdate(mutation.payload);
      else if (mutation.type === "queue_walkin") await replayQueueWalkIn(mutation.payload);
      else if (mutation.type === "pos_transaction") await replayPosTransaction(mutation.payload);
      succeeded++;
    } catch {
      failed.push(mutation);
    }
  }

  await writeQueue(failed);
  return succeeded;
}
