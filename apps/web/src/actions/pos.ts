"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

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

    if (queueTicketId) {
      await supabase
        .from("queue_tickets")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", queueTicketId)
        .eq("tenant_id", tenantId);
    }

    revalidatePath("/pos");
    revalidatePath("/queue");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Walk-in / QR payment from the mobile “Receive” flow (no queue ticket). */
export async function recordQuickPayment(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const branchId = (formData.get("branch_id") as string) || "";
    const staffProfileId = (formData.get("staff_profile_id") as string) || "";
    const paymentMethod = ((formData.get("payment_method") as string) || "cash").toLowerCase();
    const amount = Number(formData.get("amount"));
    const paymentProof = formData.get("payment_proof");

    if (!branchId) return { success: false, error: "Branch is required" };
    if (!staffProfileId) return { success: false, error: "Choose which barber received this payment" };
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Enter a valid amount greater than 0" };
    }
    if (paymentMethod !== "cash" && paymentMethod !== "qr") {
      return { success: false, error: "Invalid payment method" };
    }
    if (paymentMethod === "qr" && (!(paymentProof instanceof File) || paymentProof.size === 0)) {
      return { success: false, error: "Add a photo of the payment (QR / transfer receipt)" };
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

    const { data: staffRow, error: staffError } = await supabase
      .from("staff_profiles")
      .select("id, app_users(full_name)")
      .eq("id", staffProfileId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (staffError || !staffRow) {
      return { success: false, error: "Staff member not found" };
    }

    const appUsers = staffRow.app_users as { full_name: string | null } | { full_name: string | null }[] | null;
    const barberName = Array.isArray(appUsers) ? appUsers[0]?.full_name : appUsers?.full_name;
    const lineName = barberName ? `Payment — ${barberName}` : "Client payment";

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        customer_id: null,
        queue_ticket_id: null,
        payment_method: paymentMethod,
        cashier_user_id: appUserId,
        subtotal: amount,
        discount_amount: 0,
        tax_amount: 0,
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

    let warning: string | null = null;
    if (paymentProof instanceof File && paymentProof.size > 0) {
      const safeName = paymentProof.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${tenantId}/${transaction.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, paymentProof, {
          cacheControl: "3600",
          upsert: false,
          contentType: paymentProof.type || "image/jpeg",
        });

      if (uploadError) {
        warning =
          "Payment saved, but the photo could not be uploaded. Ask your admin to enable the payment-proofs storage bucket.";
      }
    }

    revalidatePath("/pos");
    revalidatePath("/queue");
    revalidatePath("/dashboard");
    return { success: true, warning };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
