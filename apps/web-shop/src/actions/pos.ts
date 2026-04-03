"use server";

import { revalidatePath } from "next/cache";

import { paymentMethodForDb, TRANSACTION_PAYMENT_METHODS } from "@/lib/payment-method";
import { SST_RATE } from "@/lib/malaysian-tax";

import { getAuthContext } from "./_helpers";

function splitSstFromTotal(total: number): { subtotal: number; taxAmount: number } {
  const subtotal = Math.round((total / (1 + SST_RATE)) * 100) / 100;
  const taxAmount = Math.round((total - subtotal) * 100) / 100;
  return { subtotal, taxAmount };
}

/** Client uploads to this path first; must stay under the signed-in tenant prefix. */
function proofPathBelongsToTenant(path: string | null | undefined, tenantId: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.includes("..") || path.startsWith("/")) return false;
  const first = path.split("/").filter(Boolean)[0];
  return first === tenantId;
}

export type SubmitQuickPaymentInput = {
  branchId: string;
  staffProfileId: string;
  /** UI values e.g. `cash` | `qr` */
  paymentMethodRaw: string;
  amount: number;
  /** Object key in `payment-proofs` after client-side upload */
  proofStoragePath?: string | null;
};

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
    } = data;

    if (!branchId || !paymentMethod || !items?.length) {
      return { success: false, error: "Branch, payment method, and items are required" };
    }

    const methodForDb = paymentMethodForDb(paymentMethod);
    if (!TRANSACTION_PAYMENT_METHODS.has(methodForDb)) {
      return { success: false, error: "Invalid payment method" };
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

/**
 * Walk-in / QR payment from the mobile “Receive” flow (no queue ticket).
 * Receipt images are uploaded from the browser to Storage first — this action only receives JSON.
 */
export async function submitQuickPayment(input: SubmitQuickPaymentInput) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const branchId = input.branchId?.trim() ?? "";
    const staffProfileId = input.staffProfileId?.trim() ?? "";
    const rawMethod = (input.paymentMethodRaw || "cash").toLowerCase();
    const paymentMethod = paymentMethodForDb(rawMethod);
    const amount = Number(input.amount);
    const proofStoragePath = input.proofStoragePath?.trim() || null;

    if (!branchId) return { success: false, error: "Branch is required" };
    if (!staffProfileId) return { success: false, error: "Choose which barber received this payment" };
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Enter a valid amount greater than 0" };
    }
    if (paymentMethod !== "cash" && paymentMethod !== "duitnow_qr") {
      return { success: false, error: "Invalid payment method" };
    }
    if (paymentMethod === "duitnow_qr") {
      if (!proofStoragePath || !proofPathBelongsToTenant(proofStoragePath, tenantId)) {
        return {
          success: false,
          error: "Add a photo of the payment (QR / transfer receipt)",
        };
      }
    } else if (proofStoragePath && !proofPathBelongsToTenant(proofStoragePath, tenantId)) {
      return { success: false, error: "Invalid receipt path" };
    }

    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .maybeSingle();

    if (branchError || !branch) {
      return { success: false, error: "Branch not found or inactive" };
    }

    const { data: staffProfile, error: staffProfileError } = await supabase
      .from("staff_profiles")
      .select("id, user_id")
      .eq("id", staffProfileId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (staffProfileError || !staffProfile?.user_id) {
      return { success: false, error: "Staff member not found" };
    }

    const { data: barberUser } = await supabase
      .from("app_users")
      .select("full_name")
      .eq("id", staffProfile.user_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const barberName = barberUser?.full_name ?? null;
    const lineName = barberName ? `Payment — ${barberName}` : "Client payment";

    const { subtotal: qpSubtotal, taxAmount: qpTax } = splitSstFromTotal(amount);

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        customer_id: null,
        queue_ticket_id: null,
        payment_method: paymentMethod,
        cashier_user_id: appUserId,
        subtotal: qpSubtotal,
        discount_amount: 0,
        tax_amount: qpTax,
        total_amount: amount,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (txError || !transaction) {
      return { success: false, error: txError?.message ?? "Failed to save payment" };
    }

    const { error: itemError } = await supabase.from("transaction_items").insert({
      tenant_id: tenantId,
      transaction_id: transaction.id,
      item_type: "service",
      service_id: null,
      inventory_item_id: null,
      staff_id: staffProfileId,
      name: lineName,
      quantity: 1,
      unit_price: amount,
      line_total: amount,
    });

    if (itemError) return { success: false, error: itemError.message };

    try {
      revalidatePath("/pos");
      revalidatePath("/queue");
      revalidatePath("/dashboard");
    } catch {
      /* non-fatal */
    }
    return { success: true as const };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
