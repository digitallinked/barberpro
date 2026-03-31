import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// Vercel Cron: runs weekly — cleans up stale data

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Clean up processed webhook events older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count } = await supabase
      .from("processed_webhook_events")
      .delete()
      .lt("created_at", thirtyDaysAgo.toISOString())
      .select("id", { count: "exact", head: true });

    logger.info("Cleanup cron completed", {
      action: "cron:cleanup",
      webhookEventsDeleted: count ?? 0,
    });

    return NextResponse.json({ ok: true, cleaned: count ?? 0 });
  } catch (error) {
    logger.error("Cleanup cron failed", error, { action: "cron:cleanup" });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
