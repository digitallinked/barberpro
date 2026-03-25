"use server";

import { revalidatePath } from "next/cache";

import { paymentMethodForDb } from "@/lib/payment-method";

import { getAuthContext } from "./_helpers";

export async function createQueueTicket(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const branch_id = formData.get("branch_id") as string;
    const customer_id = (formData.get("customer_id") as string) || null;
    const service_id = (formData.get("service_id") as string) || null;
    const preferred_staff_id = (formData.get("preferred_staff_id") as string) || null;

    if (!branch_id) {
      return { success: false, error: "Branch is required" };
    }

    const { count } = await supabase
      .from("queue_tickets")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("branch_id", branch_id);

    const queue_number = "Q" + String((count ?? 0) + 1).padStart(4, "0");

    const { error } = await supabase.from("queue_tickets").insert({
      tenant_id: tenantId,
      branch_id,
      customer_id: customer_id || null,
      service_id: service_id || null,
      preferred_staff_id: preferred_staff_id || null,
      queue_number,
      status: "waiting",
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/queue");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateQueueStatus(
  id: string,
  status: string,
  assignedStaffId?: string
) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (assignedStaffId !== undefined) {
      updateData.assigned_staff_id = assignedStaffId || null;
    }

    if (status === "in_service") {
      updateData.called_at = new Date().toISOString();
    }

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("queue_tickets")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/queue");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function completeQueueTicketWithPayment(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const ticketId = formData.get("ticket_id") as string;
    const rawPaymentMethod = (formData.get("payment_method") as string) || "cash";
    const paymentMethod = paymentMethodForDb(rawPaymentMethod);
    const amountDue = Number(formData.get("amount_due")) || 0;
    const amountReceived = Number(formData.get("amount_received")) || 0;
    const paymentProof = formData.get("payment_proof");

    if (!ticketId) return { success: false, error: "Ticket is required" };
    if (amountDue <= 0) return { success: false, error: "Amount due must be greater than 0" };
    if (amountReceived < amountDue) return { success: false, error: "Amount received is less than amount due" };
    if (paymentMethod === "duitnow_qr" && (!(paymentProof instanceof File) || paymentProof.size === 0)) {
      return { success: false, error: "Payment proof image is required for QR payment" };
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("queue_tickets")
      .select("id, branch_id, customer_id, service_id, assigned_staff_id, status")
      .eq("id", ticketId)
      .eq("tenant_id", tenantId)
      .single();

    if (ticketError || !ticket) {
      return { success: false, error: ticketError?.message ?? "Queue ticket not found" };
    }

    let serviceName = "Walk-in Service";
    if (ticket.service_id) {
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", ticket.service_id)
        .eq("tenant_id", tenantId)
        .single();
      if (service?.name) serviceName = service.name;
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: ticket.branch_id,
        customer_id: ticket.customer_id,
        queue_ticket_id: ticket.id,
        payment_method: paymentMethod,
        cashier_user_id: appUserId,
        subtotal: amountDue,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: amountDue,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (txError || !transaction) return { success: false, error: txError?.message ?? "Failed to create payment" };

    const { error: itemError } = await supabase.from("transaction_items").insert({
      tenant_id: tenantId,
      transaction_id: transaction.id,
      item_type: "service",
      service_id: ticket.service_id,
      inventory_item_id: null,
      staff_id: ticket.assigned_staff_id,
      name: serviceName,
      quantity: 1,
      unit_price: amountDue,
      line_total: amountDue,
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
        warning = "Payment saved, but proof upload failed. Create Supabase bucket 'payment-proofs'.";
      }
    }

    const { error: queueError } = await supabase
      .from("queue_tickets")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .eq("tenant_id", tenantId);

    if (queueError) return { success: false, error: queueError.message };

    revalidatePath("/queue");
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    return { success: true, warning };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
