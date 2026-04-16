"use server";

import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";

import { paymentMethodForDb } from "@/lib/payment-method";
import { getCustomerPublicBaseUrl } from "@/lib/env";
import { shopCalendarDateString } from "@/lib/shop-day";
import {
  createQueueTicketSchema,
  queueStatusSchema,
  queuePaymentSchema,
} from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";
import { splitSstFromTotal, roundMYR } from "@/lib/finance";
import { logger } from "@/lib/logger";

import { resolveEffectiveBranchId } from "@/lib/supabase/branch-resolution";

import { getAuthContext } from "./_helpers";
import { emitNotification } from "@/lib/notifications/emit";

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  return err.code === "23505" || /duplicate key|unique constraint/i.test(err.message ?? "");
}

export async function createQueueTicket(formData: FormData) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    const parsed = createQueueTicketSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { branch_id: formBranchId, customer_id, service_id, preferred_staff_id, party_size } = parsed.data;
    const branch_id = await resolveEffectiveBranchId(
      supabase,
      tenantId,
      appUser.branch_id ?? null,
      formBranchId ?? null
    );

    if (!branch_id) {
      return { success: false, error: "No active branch found. Add a branch or contact support." };
    }

    const queueDay = shopCalendarDateString();
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      const { count } = await supabase
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("branch_id", branch_id)
        .eq("queue_day", queueDay);

      const queue_number = "Q" + String((count ?? 0) + 1).padStart(4, "0");

      const { error } = await supabase.from("queue_tickets").insert({
        tenant_id: tenantId,
        branch_id,
        customer_id: customer_id || null,
        service_id: service_id || null,
        preferred_staff_id: preferred_staff_id || null,
        queue_number,
        queue_day: queueDay,
        status: "waiting",
        party_size,
      });

      if (!error) {
        revalidatePath("/[branchSlug]/queue", "page");
        return { success: true };
      }

      lastError = error.message;
      if (!isUniqueViolation(error)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: lastError ?? "Could not allocate queue number" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateQueueStatus(
  id: string,
  status: string,
  assignedStaffId?: string,
  seatId?: string | null
) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const statusParsed = queueStatusSchema.safeParse(status);
    if (!statusParsed.success) {
      return { success: false, error: statusParsed.error.issues[0].message };
    }

    const updateData: Record<string, unknown> = {
      status: statusParsed.data,
      updated_at: new Date().toISOString(),
    };

    if (assignedStaffId !== undefined) {
      updateData.assigned_staff_id = assignedStaffId || null;
    }

    if (seatId !== undefined) {
      updateData.seat_id = seatId || null;
    }

    if (status === "in_service") {
      updateData.called_at = new Date().toISOString();
    }

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedTicket, error } = await supabase
      .from("queue_tickets")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("id, queue_number, customer_id, branch_id")
      .single();

    if (error) return { success: false, error: error.message };

    // Notify the customer when their ticket is called or they're almost next.
    void notifyCustomerOnQueueStatusChange(
      updatedTicket,
      statusParsed.data,
      tenantId
    );

    revalidatePath("/[branchSlug]/queue", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function completeQueueTicketWithPayment(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const rawPaymentMethod = (formData.get("payment_method") as string) || "cash";
    const parsed = queuePaymentSchema.safeParse({
      ticket_id: formData.get("ticket_id"),
      payment_method: paymentMethodForDb(rawPaymentMethod),
      amount_due: formData.get("amount_due"),
      amount_received: formData.get("amount_received"),
      proof_storage_path: formData.get("proof_storage_path") || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { ticket_id: ticketId, payment_method: paymentMethod, amount_due: amountDue, amount_received: amountReceived, proof_storage_path: proofStoragePath } = parsed.data;

    if (amountReceived < amountDue) {
      return { success: false, error: "Amount received is less than amount due" };
    }
    if (paymentMethod === "duitnow_qr" && !proofStoragePath) {
      return { success: false, error: "Payment proof image is required for QR payment" };
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("queue_tickets")
      .select("id, branch_id, customer_id, service_id, assigned_staff_id, status, party_size")
      .eq("id", ticketId)
      .eq("tenant_id", tenantId)
      .single();

    if (ticketError || !ticket) {
      return { success: false, error: ticketError?.message ?? "Queue ticket not found" };
    }

    // Idempotency guard: reject if already paid
    if (ticket.status === "paid") {
      return { success: false, error: "This queue ticket has already been paid" };
    }

    // Fetch seat members for group tickets.
    const { data: seatMembers } = await supabase
      .from("queue_ticket_seats")
      .select("id, staff_id, service_id, status")
      .eq("ticket_id", ticketId)
      .eq("tenant_id", tenantId)
      .neq("status", "cancelled");

    const isGroupTicket = (seatMembers ?? []).length > 0;

    const { subtotal, taxAmount } = splitSstFromTotal(amountDue);

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        branch_id: ticket.branch_id,
        customer_id: ticket.customer_id,
        queue_ticket_id: ticket.id,
        payment_method: paymentMethod,
        cashier_user_id: appUserId,
        subtotal,
        discount_amount: 0,
        tax_amount: taxAmount,
        total_amount: amountDue,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        proof_storage_path: proofStoragePath,
      })
      .select("id")
      .single();

    if (txError || !transaction) return { success: false, error: txError?.message ?? "Failed to create payment" };

    const now = new Date().toISOString();

    if (isGroupTicket) {
      // Look up authoritative service prices from DB, then proportionally
      // allocate line totals so they sum exactly to subtotal.
      const memberPrices: Array<{ member: typeof seatMembers extends (infer T)[] | null ? T : never; serviceName: string; catalogPrice: number }> = [];
      for (const member of seatMembers!) {
        let serviceName = "Walk-in Service";
        let catalogPrice = subtotal / seatMembers!.length;
        if (member.service_id) {
          const { data: svc } = await supabase
            .from("services")
            .select("name, price")
            .eq("id", member.service_id)
            .eq("tenant_id", tenantId)
            .single();
          if (svc) {
            serviceName = svc.name;
            catalogPrice = Number(svc.price ?? catalogPrice);
          }
        }
        memberPrices.push({ member, serviceName, catalogPrice });
      }

      // Proportionally distribute subtotal across members to ensure sum matches header
      const catalogTotal = memberPrices.reduce((s, m) => s + m.catalogPrice, 0);
      const itemRows = memberPrices.map((mp, idx) => {
        let lineTotal: number;
        if (catalogTotal > 0) {
          lineTotal = roundMYR((mp.catalogPrice / catalogTotal) * subtotal);
        } else {
          lineTotal = roundMYR(subtotal / memberPrices.length);
        }
        // Last item absorbs rounding remainder
        if (idx === memberPrices.length - 1) {
          const sumSoFar = memberPrices.slice(0, -1).reduce((s, _, i) => {
            const lt = catalogTotal > 0
              ? roundMYR((memberPrices[i].catalogPrice / catalogTotal) * subtotal)
              : roundMYR(subtotal / memberPrices.length);
            return s + lt;
          }, 0);
          lineTotal = roundMYR(subtotal - sumSoFar);
        }
        return {
          tenant_id: tenantId,
          transaction_id: transaction.id,
          item_type: "service",
          service_id: mp.member.service_id,
          inventory_item_id: null,
          staff_id: mp.member.staff_id,
          name: mp.serviceName,
          quantity: 1,
          unit_price: lineTotal,
          line_total: lineTotal,
        };
      });

      const { error: itemsError } = await supabase.from("transaction_items").insert(itemRows);
      if (itemsError) return { success: false, error: itemsError.message };

      const { error: membersError } = await supabase
        .from("queue_ticket_seats")
        .update({ status: "completed", completed_at: now, updated_at: now })
        .eq("ticket_id", ticketId)
        .eq("tenant_id", tenantId)
        .neq("status", "cancelled");

      if (membersError) {
        logger.error("[completeQueueTicketWithPayment] Failed to mark seats completed", membersError, { action: "completeQueueTicketWithPayment" });
      }
    } else {
      // Single-person ticket — line_total = subtotal (matches header identity)
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

      const { error: itemError } = await supabase.from("transaction_items").insert({
        tenant_id: tenantId,
        transaction_id: transaction.id,
        item_type: "service",
        service_id: ticket.service_id,
        inventory_item_id: null,
        staff_id: ticket.assigned_staff_id,
        name: serviceName,
        quantity: 1,
        unit_price: subtotal,
        line_total: subtotal,
      });

      if (itemError) return { success: false, error: itemError.message };
    }

    const { error: queueError } = await supabase
      .from("queue_tickets")
      .update({ status: "paid", completed_at: now, updated_at: now })
      .eq("id", ticket.id)
      .eq("tenant_id", tenantId);

    if (queueError) return { success: false, error: queueError.message };

    revalidatePath("/[branchSlug]/queue", "page");
    revalidatePath("/[branchSlug]/pos", "page");
    revalidatePath("/[branchSlug]/dashboard", "page");
    revalidateTag("dashboard-stats");
    return { success: true, warning: null as string | null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Seat a single party member within a group ticket.
 *  Creates a queue_ticket_seats row and moves the parent ticket to "in_service". */
export async function addTicketSeatMember(
  ticketId: string,
  staffId: string | null,
  seatId: string | null,
  serviceId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const now = new Date().toISOString();

    const { error: insertError } = await supabase.from("queue_ticket_seats").insert({
      tenant_id: tenantId,
      ticket_id: ticketId,
      seat_id: seatId || null,
      staff_id: staffId || null,
      service_id: serviceId || null,
      status: "in_service",
      started_at: now,
    });

    if (insertError) return { success: false, error: insertError.message };

    // Move the parent ticket to in_service (if not already).
    const { error: ticketError } = await supabase
      .from("queue_tickets")
      .update({
        status: "in_service",
        called_at: now,
        updated_at: now,
      })
      .eq("id", ticketId)
      .eq("tenant_id", tenantId)
      .eq("status", "waiting"); // only transition from waiting

    if (ticketError) return { success: false, error: ticketError.message };

    revalidatePath("/[branchSlug]/queue", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Mark one party member's cut as done — frees the seat for the next customer.
 *  The parent ticket stays in_service until payment is received. */
export async function completeTicketSeatMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("queue_ticket_seats")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("id", memberId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/queue", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Remove an unstarted or cancelled party member seat assignment. */
export async function removeTicketSeatMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("queue_ticket_seats")
      .delete()
      .eq("id", memberId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/queue", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function cancelStaleWaitingQueueTickets(requestedBranchId?: string | null) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    const branchId = await resolveEffectiveBranchId(
      supabase,
      tenantId,
      appUser.branch_id ?? null,
      requestedBranchId ?? null
    );
    if (!branchId) return { success: false, error: "No active branch found" };

    const today = shopCalendarDateString();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("queue_tickets")
      .update({ status: "cancelled", updated_at: now })
      .eq("tenant_id", tenantId)
      .eq("branch_id", branchId)
      .eq("status", "waiting")
      .lt("queue_day", today);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/queue", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getQueueCheckinUrl(requestedBranchId?: string | null) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    const branchId = await resolveEffectiveBranchId(
      supabase,
      tenantId,
      appUser.branch_id ?? null,
      requestedBranchId ?? null
    );
    if (!branchId) {
      return { success: false, error: "No active branch found. Add your shop branch under Branches." };
    }

    const { data: branch, error } = await supabase
      .from("branches")
      .select("checkin_token, slug")
      .eq("id", branchId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) {
      const msg = error.message;
      const migrationHint =
        /checkin_token|column|schema cache/i.test(msg)
          ? " Run the SQL migration that adds branches.checkin_token (see supabase/migrations in the repo)."
          : "";
      return { success: false, error: `${msg}${migrationHint}` };
    }
    if (!branch) return { success: false, error: "Branch not found for this account." };

    let token = branch.checkin_token;
    if (!token) {
      token = randomUUID();
      const { error: upError } = await supabase
        .from("branches")
        .update({ checkin_token: token, updated_at: new Date().toISOString() })
        .eq("id", branchId)
        .eq("tenant_id", tenantId);

      if (upError) return { success: false, error: upError.message };
    }

    const baseUrl = getCustomerPublicBaseUrl();
    const url = `${baseUrl}/${branch.slug}/check-in/${token}`;
    return { success: true as const, url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ─── Notification helpers ─────────────────────────────────────────────────────

type TicketStub = {
  id: string;
  queue_number: string;
  customer_id: string | null;
  branch_id: string;
};

/**
 * Fire-and-forget helper: notifies a customer when their queue status changes.
 * Resolves the customer's auth_user_id via the admin client, then emits.
 * All errors are swallowed so they never affect the primary action.
 */
async function notifyCustomerOnQueueStatusChange(
  ticket: TicketStub,
  newStatus: string,
  tenantId: string
): Promise<void> {
  if (!ticket.customer_id) return;
  if (newStatus !== "in_service" && newStatus !== "waiting") return;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    // Resolve customer's auth_user_id via their shop-side customer record.
    const { data: shopCustomer } = await admin
      .from("customers")
      .select("phone, email")
      .eq("id", ticket.customer_id)
      .maybeSingle();

    if (!shopCustomer) return;

    // Match to a customer_accounts row by phone or email.
    const { data: account } = await admin
      .from("customer_accounts")
      .select("auth_user_id")
      .or(
        [
          shopCustomer.phone ? `phone.eq.${shopCustomer.phone}` : null,
          shopCustomer.email ? `email.eq.${shopCustomer.email}` : null,
        ]
          .filter(Boolean)
          .join(",")
      )
      .maybeSingle();

    if (!account?.auth_user_id) return;

    const isServing = newStatus === "in_service";
    const customerBaseUrl = process.env.CUSTOMER_APP_URL ?? "https://barberpro.my";

    await emitNotification({
      authUserId: account.auth_user_id,
      tenantId,
      category: "queue_alert",
      title: isServing ? "It's your turn!" : "Queue update",
      body: isServing
        ? `Queue ${ticket.queue_number} — please head to your barber`
        : `Your queue position has been updated`,
      actionUrl: `${customerBaseUrl}/queue/${ticket.id}`,
      data: { ticketId: ticket.id },
    });
  } catch (err) {
    console.error("[notifyCustomerOnQueueStatusChange] failed:", err);
  }
}

export async function rotateQueueCheckinToken(requestedBranchId?: string | null) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    const branchId = await resolveEffectiveBranchId(
      supabase,
      tenantId,
      appUser.branch_id ?? null,
      requestedBranchId ?? null
    );
    if (!branchId) return { success: false, error: "No active branch found" };

    const token = randomUUID();
    const { error } = await supabase
      .from("branches")
      .update({ checkin_token: token, updated_at: new Date().toISOString() })
      .eq("id", branchId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    const { data: branch } = await supabase
      .from("branches")
      .select("slug")
      .eq("id", branchId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    revalidatePath("/[branchSlug]/queue", "page");
    const baseUrl = getCustomerPublicBaseUrl();
    const url = `${baseUrl}/${branch?.slug ?? branchId}/check-in/${token}`;
    return { success: true as const, url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
