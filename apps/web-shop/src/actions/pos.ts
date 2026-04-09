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
