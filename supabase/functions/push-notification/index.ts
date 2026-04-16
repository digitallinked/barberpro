// Supabase Edge Function: push-notification
// Sends Expo push notifications for queue status changes.
// Reads tokens from public.mobile_push_tokens (new normalized table)
// with a fallback to customer_accounts.expo_push_token for existing records.
//
// Trigger: call from a database webhook on queue_tickets, or via cron.
// Invocation body: { type: "queue_position" | "status_change", ticket_id: string }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

async function sendPushMessages(messages: PushMessage[]): Promise<void> {
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

    const { data: ticket } = await supabase
      .from("queue_tickets")
      .select("id, queue_number, status, branch_id, customer_id, assigned_staff_id")
      .eq("id", ticket_id)
      .single();

    if (!ticket) {
      return new Response(JSON.stringify({ ok: true, message: "Ticket not found" }));
    }

    const messages: PushMessage[] = [];

    // ── Customer notifications ─────────────────────────────────────────────────
    if (ticket.customer_id) {
      const { data: shopCustomer } = await supabase
        .from("customers")
        .select("phone, email")
        .eq("id", ticket.customer_id)
        .maybeSingle();

      if (shopCustomer?.phone || shopCustomer?.email) {
        const orParts = [
          shopCustomer.phone ? `phone.eq.${shopCustomer.phone}` : null,
          shopCustomer.email ? `email.eq.${shopCustomer.email}` : null,
        ].filter(Boolean).join(",");

        const { data: account } = await supabase
          .from("customer_accounts")
          .select("auth_user_id, expo_push_token")
          .or(orParts)
          .maybeSingle();

        // Prefer normalized table; fall back to legacy column.
        let customerToken: string | null = null;
        if (account?.auth_user_id) {
          const { data: tokenRow } = await supabase
            .from("mobile_push_tokens")
            .select("token")
            .eq("auth_user_id", account.auth_user_id)
            .eq("platform", "expo")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          customerToken = tokenRow?.token ?? account.expo_push_token ?? null;
        } else {
          customerToken = account?.expo_push_token ?? null;
        }

        if (customerToken) {
          if (type === "queue_position" || ticket.status === "waiting") {
            const { count } = await supabase
              .from("queue_tickets")
              .select("id", { count: "exact", head: true })
              .eq("branch_id", ticket.branch_id)
              .eq("status", "waiting")
              .lt("queue_number", ticket.queue_number);

            const position = (count ?? 0) + 1;
            if (position <= 2) {
              messages.push({
                to: customerToken,
                title: position === 1 ? "You're next!" : "Almost your turn!",
                body:
                  position === 1
                    ? `Queue ${ticket.queue_number} — head over now`
                    : `Queue ${ticket.queue_number} — just ${position - 1} ahead of you`,
                data: { ticketId: ticket.id, actionUrl: `/queue/${ticket.id}` },
              });
            }
          }

          if (type === "status_change" && ticket.status === "in_service") {
            messages.push({
              to: customerToken,
              title: "It's your turn!",
              body: `Queue ${ticket.queue_number} — please head to your barber`,
              data: { ticketId: ticket.id, actionUrl: `/queue/${ticket.id}` },
            });
          }
        }
      }
    }

    // ── Staff notifications ────────────────────────────────────────────────────
    // Notify assigned staff when a new ticket enters service or is assigned.
    if (ticket.assigned_staff_id && (type === "staff_assigned" || type === "status_change")) {
      // Resolve staff's auth_user_id via staff_profiles → app_users.
      const { data: staffProfile } = await supabase
        .from("staff_profiles")
        .select("app_user_id")
        .eq("id", ticket.assigned_staff_id)
        .maybeSingle();

      if (staffProfile?.app_user_id) {
        const { data: appUser } = await supabase
          .from("app_users")
          .select("auth_user_id")
          .eq("id", staffProfile.app_user_id)
          .maybeSingle();

        if (appUser?.auth_user_id) {
          const { data: tokenRows } = await supabase
            .from("mobile_push_tokens")
            .select("token")
            .eq("auth_user_id", appUser.auth_user_id)
            .eq("platform", "expo");

          for (const { token } of tokenRows ?? []) {
            messages.push({
              to: token,
              title: "Queue update",
              body: `Queue ${ticket.queue_number} is ready for service`,
              data: { ticketId: ticket.id, actionUrl: "/queue" },
            });
          }
        }
      }
    }

    await sendPushMessages(messages);

    return new Response(JSON.stringify({ ok: true, sent: messages.length }));
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
