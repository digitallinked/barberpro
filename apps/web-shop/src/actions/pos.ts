"use server";

import { revalidatePath } from "next/cache";

import { paymentMethodForDb, TRANSACTION_PAYMENT_METHODS } from "@/lib/payment-method";

import { getAuthContext } from "./_helpers";

/** Client uploads to this path first; must stay under the signed-in tenant prefix. */
function proofPathBelongsToTenant(path: string | null | undefined, tenantId: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.includes("..") || path.startsWith("/")) return false;
  const first = path.split("/").filter(Boolean)[0];
  return first === tenantId;
}

type TransactionItem = {
  itemType: string;
  serviceId: string | null;
  inventoryItemId: string | null;
  staffId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CreateTransactionData = {
  branchId: string;
  customerId: string | null;
  queueTicketId: string | null;
  paymentMethod: string;
  items: TransactionItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  proofStoragePath?: string | null;
};

export async function createTransaction(data: CreateTransactionData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const {
      branchId,
      customerId,
      queueTicketId,
      paymentMethod,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      proofStoragePath,
    } = data;

    if (!branchId || !paymentMethod || !items?.length) {
      return { success: false, error: "Branch, payment method, and items are required" };
    }

    const methodForDb = paymentMethodForDb(paymentMethod);
    if (!TRANSACTION_PAYMENT_METHODS.has(methodForDb)) {
      return { success: false, error: "Invalid payment method" };
    }

    const cleanProofPath = proofStoragePath?.trim() || null;
    if (cleanProofPath && !proofPathBelongsToTenant(cleanProofPath, tenantId)) {
      return { success: false, error: "Invalid receipt path" };
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        customer_id: customerId || null,
        queue_ticket_id: queueTicketId || null,
        payment_method: methodForDb,
        cashier_user_id: appUserId,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        proof_storage_path: cleanProofPath,
      })
      .select("id")
      .single();

    if (txError) return { success: false, error: txError.message };
    if (!transaction) return { success: false, error: "Failed to create transaction" };

    const transactionItems = items.map((item) => ({
      tenant_id: tenantId,
      transaction_id: transaction.id,
      item_type: item.itemType,
      service_id: item.serviceId || null,
      inventory_item_id: item.inventoryItemId || null,
      staff_id: item.staffId || null,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    }));

    const { error: itemsError } = await supabase
      .from("transaction_items")
      .insert(transactionItems);

    if (itemsError) return { success: false, error: itemsError.message };

    for (const item of items) {
      if (item.itemType === "product" && item.inventoryItemId && item.quantity > 0) {
        const { data: invItem } = await supabase
          .from("inventory_items")
          .select("stock_qty")
          .eq("id", item.inventoryItemId)
          .eq("tenant_id", tenantId)
          .single();

        if (invItem) {
          const newQty = Math.max(0, invItem.stock_qty - item.quantity);
          await supabase
            .from("inventory_items")
            .update({
              stock_qty: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.inventoryItemId)
            .eq("tenant_id", tenantId);
        }
      }
    }

    if (queueTicketId) {
      const now = new Date().toISOString();

      const { error: ticketError } = await supabase
        .from("queue_tickets")
        .update({
          status: "paid",
          completed_at: now,
          updated_at: now,
        })
        .eq("id", queueTicketId)
        .eq("tenant_id", tenantId);

      if (ticketError) {
        console.error("[createTransaction] Failed to mark queue ticket as paid:", ticketError.message);
      }

      // Mark all seat members as completed so the seat panel reflects reality.
      const { error: seatsError } = await supabase
        .from("queue_ticket_seats")
        .update({ status: "completed", completed_at: now, updated_at: now })
        .eq("ticket_id", queueTicketId)
        .eq("tenant_id", tenantId)
        .neq("status", "completed");

      if (seatsError) {
        console.error("[createTransaction] Failed to mark ticket seats as completed:", seatsError.message);
      }
    }

    revalidatePath("/pos");
    revalidatePath("/queue");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ─── Linked-queue checkout (multi-barber safe) ─────────────────────────────────

type LinkedQueueProduct = {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type LinkedQueueCheckoutData = {
  queueTicketId: string;
  paymentMethod: string;
  products: LinkedQueueProduct[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  proofStoragePath?: string | null;
};

export async function createTransactionFromQueueTicket(data: LinkedQueueCheckoutData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const {
      queueTicketId,
      paymentMethod,
      products,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      proofStoragePath,
    } = data;

    if (!queueTicketId || !paymentMethod) {
      return { success: false, error: "Queue ticket and payment method are required" };
    }

    const methodForDb = paymentMethodForDb(paymentMethod);
    if (!TRANSACTION_PAYMENT_METHODS.has(methodForDb)) {
      return { success: false, error: "Invalid payment method" };
    }

    const cleanProofPath = proofStoragePath?.trim() || null;
    if (cleanProofPath && !proofPathBelongsToTenant(cleanProofPath, tenantId)) {
      return { success: false, error: "Invalid receipt path" };
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("queue_tickets")
      .select("id, branch_id, customer_id, status")
      .eq("id", queueTicketId)
      .eq("tenant_id", tenantId)
      .single();

    if (ticketError || !ticket) {
      return { success: false, error: ticketError?.message ?? "Queue ticket not found" };
    }

    if (ticket.status === "paid") {
      return { success: false, error: "This queue ticket has already been paid" };
    }

    const { data: seatMembers, error: seatsLoadError } = await supabase
      .from("queue_ticket_seats")
      .select("id, staff_id, service_id")
      .eq("ticket_id", queueTicketId)
      .eq("tenant_id", tenantId)
      .neq("status", "cancelled");

    if (seatsLoadError) {
      return { success: false, error: seatsLoadError.message };
    }

    const seats = seatMembers ?? [];
    if (seats.length === 0) {
      return { success: false, error: "No seated members found for this ticket" };
    }

    const unassigned = seats.filter((s) => !s.staff_id);
    if (unassigned.length > 0) {
      return { success: false, error: "All seated members must have a barber assigned before payment" };
    }

    const serviceIds = [...new Set(seats.map((s) => s.service_id).filter(Boolean) as string[])];
    const serviceMap = new Map<string, { name: string; price: number }>();
    if (serviceIds.length > 0) {
      const { data: svcs } = await supabase
        .from("services")
        .select("id, name, price")
        .in("id", serviceIds)
        .eq("tenant_id", tenantId);
      for (const s of svcs ?? []) {
        serviceMap.set(s.id, { name: s.name, price: Number(s.price ?? 0) });
      }
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: ticket.branch_id,
        customer_id: ticket.customer_id,
        queue_ticket_id: ticket.id,
        payment_method: methodForDb,
        cashier_user_id: appUserId,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        proof_storage_path: cleanProofPath,
      })
      .select("id")
      .single();

    if (txError || !transaction) {
      return { success: false, error: txError?.message ?? "Failed to create transaction" };
    }

    const serviceItems = seats.map((member) => {
      const svc = member.service_id ? serviceMap.get(member.service_id) : null;
      const price = svc?.price ?? 0;
      return {
        tenant_id: tenantId,
        transaction_id: transaction.id,
        item_type: "service",
        service_id: member.service_id || null,
        inventory_item_id: null,
        staff_id: member.staff_id,
        name: svc?.name ?? "Walk-in Service",
        quantity: 1,
        unit_price: price,
        line_total: price,
      };
    });

    const productItems = (products ?? []).map((p) => ({
      tenant_id: tenantId,
      transaction_id: transaction.id,
      item_type: "product",
      service_id: null,
      inventory_item_id: p.inventoryItemId || null,
      staff_id: null,
      name: p.name,
      quantity: p.quantity,
      unit_price: p.unitPrice,
      line_total: p.lineTotal,
    }));

    const allItems = [...serviceItems, ...productItems];
    if (allItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(allItems);
      if (itemsError) return { success: false, error: itemsError.message };
    }

    for (const p of products ?? []) {
      if (p.inventoryItemId && p.quantity > 0) {
        const { data: invItem } = await supabase
          .from("inventory_items")
          .select("stock_qty")
          .eq("id", p.inventoryItemId)
          .eq("tenant_id", tenantId)
          .single();

        if (invItem) {
          const newQty = Math.max(0, invItem.stock_qty - p.quantity);
          await supabase
            .from("inventory_items")
            .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
            .eq("id", p.inventoryItemId)
            .eq("tenant_id", tenantId);
        }
      }
    }

    const now = new Date().toISOString();

    await supabase
      .from("queue_tickets")
      .update({ status: "paid", completed_at: now, updated_at: now })
      .eq("id", queueTicketId)
      .eq("tenant_id", tenantId);

    await supabase
      .from("queue_ticket_seats")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("ticket_id", queueTicketId)
      .eq("tenant_id", tenantId)
      .neq("status", "completed");

    revalidatePath("/pos");
    revalidatePath("/queue");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
