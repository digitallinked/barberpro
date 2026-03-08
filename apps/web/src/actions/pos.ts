"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

type TransactionItem = {
  itemType: string;
  serviceId?: string;
  inventoryItemId?: string;
  staffId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CreateTransactionData = {
  branchId: string;
  customerId?: string;
  queueTicketId?: string;
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

    revalidatePath("/pos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
