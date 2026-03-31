// Supabase Edge Function: push-notification
// Sends Expo push notifications when queue status changes.
// Trigger: call via database webhook or cron on queue_tickets updates.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

async function sendPushNotifications(messages: PushMessage[]) {
  if (messages.length === 0) return;

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    console.error("Expo push failed:", await response.text());
  }
}

serve(async (req: Request) => {
  try {
    const { type, ticket_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!ticket_id) {
      return new Response(JSON.stringify({ error: "ticket_id required" }), { status: 400 });
    }

    // Get ticket with customer info
    const { data: ticket } = await supabase
      .from("queue_tickets")
      .select("id, queue_number, status, branch_id, customer_id")
      .eq("id", ticket_id)
      .single();

    if (!ticket?.customer_id) {
      return new Response(JSON.stringify({ ok: true, message: "No customer on ticket" }));
    }

    // Look up the customer's push token
    const { data: customer } = await supabase
      .from("customers")
      .select("phone")
      .eq("id", ticket.customer_id)
      .single();

    if (!customer?.phone) {
      return new Response(JSON.stringify({ ok: true, message: "No phone for customer" }));
    }

    // Find matching customer_account by email/phone
    const { data: account } = await supabase
      .from("customer_accounts")
      .select("expo_push_token")
      .or(`email.eq.${customer.phone},phone.eq.${customer.phone}`)
      .maybeSingle();

    if (!account?.expo_push_token) {
      return new Response(JSON.stringify({ ok: true, message: "No push token" }));
    }

    const messages: PushMessage[] = [];

    if (type === "queue_position" || ticket.status === "waiting") {
      // Calculate position
      const { count } = await supabase
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", ticket.branch_id)
        .eq("status", "waiting")
        .lt("queue_number", ticket.queue_number);

      const position = (count ?? 0) + 1;

      if (position <= 2) {
        messages.push({
          to: account.expo_push_token,
          title: position === 1 ? "You're next!" : "Almost your turn!",
          body: position === 1
            ? `Queue ${ticket.queue_number} — you're next in line!`
            : `Queue ${ticket.queue_number} — just ${position - 1} person ahead`,
          data: { ticketId: ticket.id },
        });
      }
    }

    if (type === "status_change" && ticket.status === "in_service") {
      messages.push({
        to: account.expo_push_token,
        title: "It's your turn!",
        body: `Queue ${ticket.queue_number} — please head to your seat`,
        data: { ticketId: ticket.id },
      });
    }

    await sendPushNotifications(messages);

    return new Response(JSON.stringify({ ok: true, sent: messages.length }));
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
