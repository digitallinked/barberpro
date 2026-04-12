import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { trialEndingEmail } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// ─── Auth ────────────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  // Vercel Cron passes Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get("authorization");
  if (env.CRON_SECRET) {
    return auth === `Bearer ${env.CRON_SECRET}`;
  }
  // In development without CRON_SECRET, allow localhost calls
  return process.env.NODE_ENV !== "production";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function billingUrl(): string {
  return `${(env.NEXT_PUBLIC_APP_URL ?? "https://shop.barberpro.my").replace(/\/$/, "")}/billing`;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobRunId = crypto.randomUUID();

  try {
    const supabase = createAdminClient();

    const now = new Date();
    const results = {
      expired: 0,
      reminded_7d: 0,
      reminded_3d: 0,
      reminded_1d: 0,
      errors: [] as string[],
    };

    // ── 1. Expire trials that have passed their end date ───────────────────
    const { data: expiredTrials, error: expireErr } = await supabase
      .from("tenants")
      .select("id, name, email, owner_auth_id")
      .eq("subscription_status", "trialing")
      .is("stripe_subscription_id", null)
      .lt("trial_ends_at", now.toISOString());

    if (expireErr) {
      logger.error("[expire-trials] Failed to query expired trials", expireErr, { jobRunId });
      results.errors.push(`expire query: ${expireErr.message}`);
    } else if (expiredTrials && expiredTrials.length > 0) {
      const expiredIds = expiredTrials.map((t) => t.id);
      const { error: updateErr } = await supabase
        .from("tenants")
        .update({ subscription_status: "canceled" })
        .in("id", expiredIds);

      if (updateErr) {
        logger.error("[expire-trials] Failed to mark trials as canceled", updateErr, { jobRunId });
        results.errors.push(`update canceled: ${updateErr.message}`);
      } else {
        results.expired = expiredIds.length;
        logger.info("[expire-trials] Marked trials as canceled", { jobRunId, count: expiredIds.length });
      }
    }

    // ── 2. Send reminder emails ─────────────────────────────────────────────
    const reminderWindows = [
      { days: 7, key: "reminded_7d" as const },
      { days: 3, key: "reminded_3d" as const },
      { days: 1, key: "reminded_1d" as const },
    ];

    for (const { days, key } of reminderWindows) {
      // Window: ±12 hours around the target day (so daily cron doesn't miss)
      const windowStart = new Date(now.getTime() + (days - 0.5) * 24 * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (days + 0.5) * 24 * 60 * 60 * 1000);

      const { data: tenantsToRemind, error: reminderErr } = await supabase
        .from("tenants")
        .select("id, name, email, owner_auth_id, plan, trial_ends_at")
        .eq("subscription_status", "trialing")
        .is("stripe_subscription_id", null)
        .gte("trial_ends_at", windowStart.toISOString())
        .lte("trial_ends_at", windowEnd.toISOString());

      if (reminderErr) {
        logger.error("[expire-trials] Failed to query reminder candidates", reminderErr, {
          jobRunId,
          days,
        });
        results.errors.push(`reminder ${days}d query: ${reminderErr.message}`);
        continue;
      }

      if (!tenantsToRemind || tenantsToRemind.length === 0) continue;

      for (const tenant of tenantsToRemind) {
        try {
          let recipientEmail = tenant.email as string | null;
          let ownerName = tenant.name as string;

          if (tenant.owner_auth_id) {
            const { data: authUser } = await supabase.auth.admin.getUserById(
              tenant.owner_auth_id as string
            );
            if (authUser?.user?.email) recipientEmail = authUser.user.email;
            if (authUser?.user?.user_metadata?.full_name) {
              ownerName = authUser.user.user_metadata.full_name as string;
            }
          }

          if (!recipientEmail) continue;

          const trialEndsAt = tenant.trial_ends_at as string;
          const daysLeft = daysUntil(trialEndsAt);

          const tpl = trialEndingEmail({
            ownerName,
            shopName: tenant.name as string,
            plan: (tenant.plan as string) ?? "starter",
            trialEndsAt: formatDate(trialEndsAt),
            daysLeft: Math.max(1, daysLeft),
            billingUrl: billingUrl(),
            requiresPayment: true,
          });

          await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });
          results[key]++;
        } catch (err) {
          logger.error("[expire-trials] Failed to send reminder email", err, {
            jobRunId,
            days,
          });
          results.errors.push(`reminder ${days}d for ${tenant.id}: ${String(err)}`);
        }
      }
    }

    logger.info("[expire-trials] Cron completed", { jobRunId, ...results });
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    logger.error("[expire-trials] Unhandled error", err, { jobRunId });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
