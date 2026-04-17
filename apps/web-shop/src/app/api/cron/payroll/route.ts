import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// Vercel Cron: runs daily at midnight MYT (4pm UTC)
// Calculates daily commission for all active barbers.

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (env.CRON_SECRET) {
    return auth === `Bearer ${env.CRON_SECRET}`;
  }
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Get yesterday's date in MYT
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    logger.info("Payroll cron started", { action: "cron:payroll", date: dateStr });

    // This is a placeholder — actual logic would:
    // 1. Query transaction_items for yesterday grouped by staff_profile_id
    // 2. Calculate commission based on staff commission_rate
    // 3. Upsert into a daily_commissions summary table

    const { count } = await supabase
      .from("transaction_items")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${dateStr}T00:00:00`)
      .lt("created_at", `${dateStr}T23:59:59`);

    logger.info("Payroll cron completed", {
      action: "cron:payroll",
      date: dateStr,
      transactionItems: count ?? 0,
    });

    return NextResponse.json({ ok: true, date: dateStr, items: count ?? 0 });
  } catch (error) {
    logger.error("Payroll cron failed", error, { action: "cron:payroll" });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
