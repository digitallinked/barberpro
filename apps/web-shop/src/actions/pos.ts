"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { paymentMethodForDb } from "@/lib/payment-method";
import { posTransactionSchema, linkedQueueCheckoutSchema } from "@/validations/schemas";
import { logger } from "@/lib/logger";
import {
  computeTransactionTotals,
  validateClientTotals,
  roundMYR,
  type LineItemInput,
} from "@/lib/finance";

import { getAuthContext } from "./_helpers";

function proofPathBelongsToTenant(path: string | null | undefined, tenantId: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.includes("..") || path.startsWith("/")) return false;
  const first = path.split("/").filter(Boolean)[0];
  return first === tenantId;
}

type CreateTransactionData = {
  branchId: string;
  customerId: string | null;
  queueTicketId: string | null;
  paymentMethod: string;
  items: Array<{
    itemType: string;
    serviceId: string | null;
    inventoryItemId: string | null;
    staffId: string | null;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  proofStoragePath?: string | null;
};

export async function createTransaction(data: CreateTransactionData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const parsed = posTransactionSchema.safeParse({
      ...data,
      paymentMethod: paymentMethodForDb(data.paymentMethod),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      branchId,
      customerId,
      queueTicketId,
      paymentMethod,
      items,
      discountAmount,
      proofStoragePath,
    } = parsed.data;

    const cleanProofPath = proofStoragePath ?? null;
    if (cleanProofPath && !proofPathBelongsToTenant(cleanProofPath, tenantId)) {
      return { success: false, error: "Invalid receipt path" };
    }

    // Server-authoritative: recompute totals from line items
    const lineInputs: LineItemInput[] = items.map((item) => ({
      itemType: item.itemType === "service" ? "service" : "product",
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      staffId: item.staffId || null,
      serviceId: item.serviceId || null,
      inventoryItemId: item.inventoryItemId || null,
      name: item.name,
    }));

    const serverTotals = computeTransactionTotals(lineInputs, discountAmount);

    // Validate client values against server computation
    const validation = validateClientTotals(
      parsed.data.subtotal,
      parsed.data.taxAmount,
      parsed.data.totalAmount,
      serverTotals
    );
    if (!validation.valid) {
      logger.error("[createTransaction] Client total validation failed", { reason: validation.reason }, { action: "createTransaction" });
    }

    // Always use server-computed values for persistence
    const { subtotal, taxAmount, totalAmount } = serverTotals;

    // Idempotency: if queue ticket is already paid, reject
    if (queueTicketId) {
      const { data: existingTicket } = await supabase
        .from("queue_tickets")
        .select("status")
        .eq("id", queueTicketId)
        .eq("tenant_id", tenantId)
        .single();

      if (existingTicket?.status === "paid") {
        return { success: false, error: "This queue ticket has already been paid" };
      }
    }

    const now = new Date().toISOString();

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        customer_id: customerId || null,
        queue_ticket_id: queueTicketId || null,
        payment_method: paymentMethod,
        cashier_user_id: appUserId,
        subtotal,
        discount_amount: roundMYR(discountAmount),
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: "paid",
        paid_at: now,
        proof_storage_path: cleanProofPath,
      })
      .select("id")
      .single();

    if (txError) return { success: false, error: txError.message };
    if (!transaction) return { success: false, error: "Failed to create transaction" };

    const transactionItems = serverTotals.items.map((item) => ({
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

    // Stock deduction + inventory movement audit trail
    for (const item of serverTotals.items) {
      if (item.itemType === "product" && item.inventoryItemId && item.quantity > 0) {
        const { data: invItem } = await supabase
          .from("inventory_items")
          .select("stock_qty, branch_id, unit_cost")
          .eq("id", item.inventoryItemId)
          .eq("tenant_id", tenantId)
          .single();

        if (invItem) {
          const newQty = Math.max(0, invItem.stock_qty - item.quantity);
          const { error: updateError } = await supabase
            .from("inventory_items")
            .update({ stock_qty: newQty, updated_at: now })
            .eq("id", item.inventoryItemId)
            .eq("tenant_id", tenantId);

          if (updateError) {
            logger.error("[createTransaction] Stock update failed", updateError, { action: "createTransaction" });
          }

          // Record inventory movement for audit trail
          const { error: movementError } = await supabase.from("inventory_movements").insert({
            tenant_id: tenantId,
            inventory_item_id: item.inventoryItemId,
            branch_id: invItem.branch_id,
            movement_type: "sale",
            quantity: item.quantity,
            reason: `POS sale — transaction ${transaction.id}`,
            reference_id: transaction.id,
            unit_cost_at_time: invItem.unit_cost ?? null,
            created_by: appUserId,
          });

          if (movementError) {
            logger.error("[createTransaction] Inventory movement insert failed", movementError, { action: "createTransaction" });
          }
        }
      }
    }

    if (queueTicketId) {
      const { error: ticketError } = await supabase
        .from("queue_tickets")
        .update({ status: "paid", completed_at: now, updated_at: now })
        .eq("id", queueTicketId)
        .eq("tenant_id", tenantId);

      if (ticketError) {
        logger.error("[createTransaction] Failed to mark queue ticket as paid", ticketError, { action: "createTransaction" });
      }

      const { error: seatsError } = await supabase
        .from("queue_ticket_seats")
        .update({ status: "completed", completed_at: now, updated_at: now })
        .eq("ticket_id", queueTicketId)
        .eq("tenant_id", tenantId)
        .neq("status", "completed");

      if (seatsError) {
        logger.error("[createTransaction] Failed to mark ticket seats as completed", seatsError, { action: "createTransaction" });
      }
    }

    revalidatePath("/[branchSlug]/pos", "page");
    revalidatePath("/[branchSlug]/queue", "page");
    revalidatePath("/[branchSlug]/dashboard", "page");
    revalidateTag("dashboard-stats");
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

    const parsed = linkedQueueCheckoutSchema.safeParse({
      ...data,
      paymentMethod: paymentMethodForDb(data.paymentMethod),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      queueTicketId,
      paymentMethod,
      products,
      proofStoragePath,
    } = parsed.data;

    const cleanProofPath = proofStoragePath ?? null;
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

    // Look up authoritative service prices from DB
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

    // Build authoritative line items from DB prices
    const lineInputs: LineItemInput[] = [
      ...seats.map((member) => {
        const svc = member.service_id ? serviceMap.get(member.service_id) : null;
        return {
          itemType: "service" as const,
          unitPrice: svc?.price ?? 0,
          quantity: 1,
          staffId: member.staff_id,
          serviceId: member.service_id || null,
          inventoryItemId: null,
          name: svc?.name ?? "Walk-in Service",
        };
      }),
      ...(products ?? []).map((p) => ({
        itemType: "product" as const,
        unitPrice: p.unitPrice,
        quantity: p.quantity,
        staffId: null,
        serviceId: null,
        inventoryItemId: p.inventoryItemId || null,
        name: p.name,
      })),
    ];

    const discountAmount = parsed.data.discountAmount ?? 0;
    const serverTotals = computeTransactionTotals(lineInputs, discountAmount);

    const now = new Date().toISOString();

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: ticket.branch_id,
        customer_id: ticket.customer_id,
        queue_ticket_id: ticket.id,
        payment_method: paymentMethod,
        cashier_user_id: appUserId,
        subtotal: serverTotals.subtotal,
        discount_amount: serverTotals.discountAmount,
        tax_amount: serverTotals.taxAmount,
        total_amount: serverTotals.totalAmount,
        payment_status: "paid",
        paid_at: now,
        proof_storage_path: cleanProofPath,
      })
      .select("id")
      .single();

    if (txError || !transaction) {
      return { success: false, error: txError?.message ?? "Failed to create transaction" };
    }

    const allItems = serverTotals.items.map((item) => ({
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

    if (allItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(allItems);
      if (itemsError) return { success: false, error: itemsError.message };
    }

    // Stock deduction + inventory movement audit trail for products
    for (const p of products ?? []) {
      if (p.inventoryItemId && p.quantity > 0) {
        const { data: invItem } = await supabase
          .from("inventory_items")
          .select("stock_qty, branch_id, unit_cost")
          .eq("id", p.inventoryItemId)
          .eq("tenant_id", tenantId)
          .single();

        if (invItem) {
          const newQty = Math.max(0, invItem.stock_qty - p.quantity);
          await supabase
            .from("inventory_items")
            .update({ stock_qty: newQty, updated_at: now })
            .eq("id", p.inventoryItemId)
            .eq("tenant_id", tenantId);

          await supabase.from("inventory_movements").insert({
            tenant_id: tenantId,
            inventory_item_id: p.inventoryItemId,
            branch_id: invItem.branch_id,
            movement_type: "sale",
            quantity: p.quantity,
            reason: `Linked queue sale — transaction ${transaction.id}`,
            reference_id: transaction.id,
            unit_cost_at_time: invItem.unit_cost ?? null,
            created_by: appUserId,
          });
        }
      }
    }

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

    revalidatePath("/[branchSlug]/pos", "page");
    revalidatePath("/[branchSlug]/queue", "page");
    revalidatePath("/[branchSlug]/dashboard", "page");
    revalidateTag("dashboard-stats");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
