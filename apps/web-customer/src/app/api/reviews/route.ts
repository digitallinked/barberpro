import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const Schema = z.object({
  slug: z.string().min(1).max(100),
  reviewer_name: z.string().trim().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    // ── 1. Require authentication ────────────────────────────────────────────
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "You must be signed in to leave a review" }, { status: 401 });
    }

    // ── 2. Validate input ────────────────────────────────────────────────────
    const body: unknown = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { slug, reviewer_name, rating, comment } = parsed.data;
    const admin = createAdminClient();

    // ── 3. Resolve tenant from slug (prevents spoofed tenant_id) ────────────
    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // ── 4. Verify the user has a completed visit at this shop ────────────────
    // Authenticated users have their email stored as `phone` in `customers`.
    const { data: customerRows } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("phone", user.email);

    const customerIds = (customerRows ?? []).map((c) => c.id);

    let hasVisited = false;

    if (customerIds.length > 0) {
      // Check for a completed queue visit (done or paid)
      const { count: queueCount } = await admin
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .in("customer_id", customerIds)
        .in("status", ["done", "paid"]);

      if ((queueCount ?? 0) > 0) hasVisited = true;

      // Check for a completed appointment
      if (!hasVisited) {
        const { count: apptCount } = await admin
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .in("customer_id", customerIds)
          .eq("status", "completed");

        if ((apptCount ?? 0) > 0) hasVisited = true;
      }
    }

    if (!hasVisited) {
      return NextResponse.json(
        { error: "You can only review shops you have visited" },
        { status: 403 }
      );
    }

    // ── 5. Insert review ─────────────────────────────────────────────────────
    const { error } = await admin.from("shop_reviews").insert({
      tenant_id: tenant.id,
      reviewer_name,
      rating,
      comment: comment || null,
    });

    if (error) {
      logger.error("Review insert error", error, { action: "POST /api/reviews" });
      return NextResponse.json({ error: "Could not save review" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
