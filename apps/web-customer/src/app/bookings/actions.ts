"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { shopCalendarDateString } from "@/lib/shop-day";

type ActionResult = { success: true } | { success: false; error: string };

export async function cancelAppointmentAction(
  appointmentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const userEmail = user.email ?? "";
    const admin = createAdminClient();

    const { data: appt } = await admin
      .from("appointments")
      .select("id, status, customers(phone)")
      .eq("id", appointmentId)
      .maybeSingle();

    if (!appt) return { success: false, error: "Appointment not found" };

    const customerPhone = (appt.customers as { phone: string } | null)?.phone;
    if (customerPhone !== userEmail) {
      return { success: false, error: "Not authorised to cancel this appointment" };
    }

    if (appt.status !== "confirmed") {
      return { success: false, error: "Only confirmed appointments can be cancelled" };
    }

    const { error } = await admin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/bookings");
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

const joinQueueSchema = z.object({
  branchId: z.string().uuid("Invalid branch"),
  partySize: z.number().int().min(1).max(20),
});

export type JoinQueueResult =
  | { success: true; ticketId: string; queueNumber: string; branchName: string }
  | { success: false; error: string };

export async function joinQueueAsCustomerAction(
  branchId: string,
  partySize: number
): Promise<JoinQueueResult> {
  const parsed = joinQueueSchema.safeParse({ branchId, partySize });
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const userEmail = user.email ?? "";
    if (!userEmail) return { success: false, error: "No email on account" };

    const admin = createAdminClient();

    // Verify branch exists, is active, and accepts walk-in queue
    const { data: branch } = await admin
      .from("branches")
      .select("id, name, tenant_id, accepts_walkin_queue")
      .eq("id", branchId)
      .eq("is_active", true)
      .maybeSingle();

    if (!branch) return { success: false, error: "Branch not found or inactive" };
    if (!branch.accepts_walkin_queue) {
      return { success: false, error: "This branch is not accepting walk-in customers at this time." };
    }

    // Find or create customer record for this tenant (email stored as phone for web users)
    let { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", branch.tenant_id)
      .eq("phone", userEmail)
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: custError } = await admin
        .from("customers")
        .insert({
          tenant_id: branch.tenant_id,
          branch_id: branchId,
          full_name: user.user_metadata?.full_name ?? userEmail,
          phone: userEmail,
          loyalty_points: 0,
        })
        .select("id")
        .single();

      if (custError || !newCustomer) {
        return { success: false, error: custError?.message ?? "Could not create customer record" };
      }
      customer = newCustomer;
    }

    const queueDay = shopCalendarDateString();

    // Retry up to 8 times in case of queue_number collision
    for (let attempt = 0; attempt < 8; attempt++) {
      const { count } = await admin
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", branch.tenant_id)
        .eq("branch_id", branchId)
        .eq("queue_day", queueDay);

      const queue_number = "Q" + String((count ?? 0) + 1).padStart(4, "0");

      const { data: ticket, error: ticketError } = await admin
        .from("queue_tickets")
        .insert({
          tenant_id: branch.tenant_id,
          branch_id: branchId,
          customer_id: customer.id,
          queue_number,
          queue_day: queueDay,
          status: "waiting",
          party_size: partySize,
          member_services: [],
        })
        .select("id, queue_number")
        .single();

      if (!ticketError && ticket) {
        revalidatePath("/bookings");
        revalidatePath("/queue");
        return {
          success: true,
          ticketId: ticket.id,
          queueNumber: String(ticket.queue_number),
          branchName: branch.name,
        };
      }

      // Retry only on unique constraint violation (collision on queue_number)
      const isCollision =
        ticketError?.code === "23505" ||
        /duplicate key|unique constraint/i.test(ticketError?.message ?? "");
      if (!isCollision) {
        return { success: false, error: ticketError?.message ?? "Could not join queue" };
      }
    }

    return { success: false, error: "Could not assign queue number. Please try again." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "An unexpected error occurred" };
  }
}
