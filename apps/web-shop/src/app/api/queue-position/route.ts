import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { shopCalendarDateString } from "@/lib/shop-day";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticket_id");
  const branchId = searchParams.get("branch_id");

  if (!ticketId || !branchId) {
    return NextResponse.json({ error: "ticket_id and branch_id are required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const queueDay = shopCalendarDateString();

    // Fetch the customer's ticket.
    const { data: ticket, error: ticketError } = await admin
      .from("queue_tickets")
      .select("id, queue_number, status, seat_id, created_at")
      .eq("id", ticketId)
      .eq("branch_id", branchId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Count how many waiting tickets are ahead of this one.
    const { count: position } = await admin
      .from("queue_tickets")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .eq("queue_day", queueDay)
      .eq("status", "waiting")
      .lt("created_at", ticket.created_at);

    // Find what's currently being served.
    const { data: nowServingRow } = await admin
      .from("queue_tickets")
      .select("queue_number")
      .eq("branch_id", branchId)
      .eq("queue_day", queueDay)
      .eq("status", "in_service")
      .order("called_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If the ticket is in_service, fetch the seat label.
    let seatLabel: string | null = null;
    if (ticket.status === "in_service" && ticket.seat_id) {
      const { data: seat } = await admin
        .from("branch_seats")
        .select("seat_number, label")
        .eq("id", ticket.seat_id)
        .maybeSingle();
      if (seat) {
        seatLabel = seat.label || `Seat ${seat.seat_number}`;
      }
    }

    return NextResponse.json({
      status: ticket.status,
      queue_number: ticket.queue_number,
      position: (position ?? 0) + (ticket.status === "waiting" ? 1 : 0),
      now_serving: nowServingRow?.queue_number ?? null,
      seat_label: seatLabel,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
