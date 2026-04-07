import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Clock, MapPin, Scissors, CalendarCheck, CheckCircle2,
  Hash, Ban, Navigation, Users, Sparkles, QrCode,
} from "lucide-react";


import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { shopCalendarDateString } from "@/lib/shop-day";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ShopImageCarousel } from "@/components/shop-image-carousel";
import { ReviewsSection } from "@/components/reviews-section";

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/shop-media";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booked?: string }>;
};

export default async function ShopProfilePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { booked } = await searchParams;
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!tenant) notFound();

  const tenantLogoUrl = tenant.logo_url ?? null;

  const [branchesResult, servicesResult, staffResult, queueResult, imagesResult, reviewsResult] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id, name, address, operating_hours, accepts_online_bookings, accepts_walkin_queue, checkin_token")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true),
      supabase
        .from("services")
        .select("id, name, is_active")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("staff_profiles")
        .select("id")
        .eq("tenant_id", tenant.id),
      supabase
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("queue_day", shopCalendarDateString())
        .in("status", ["waiting", "in_service"]),
      supabase
        .from("tenant_images")
        .select("storage_path")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("shop_reviews")
        .select("id, reviewer_name, rating, comment, created_at")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const branches = branchesResult.data ?? [];
  const services = servicesResult.data ?? [];
  const staffCount = staffResult.data?.length ?? 0;
  const activeQueueCount = queueResult.count ?? 0;
  const shopImageUrls = (imagesResult.data ?? []).map(
    (img) => `${STORAGE_URL}/${img.storage_path}`
  );
  const reviews = reviewsResult.data ?? [];

  // ── Check if current user has a completed visit at this shop ──────────────
  let isLoggedIn = false;
  let canReview = false;
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (user?.email) {
      isLoggedIn = true;
      const { data: customerRows } = await supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("phone", user.email);

      const customerIds = (customerRows ?? []).map((c) => c.id);
      if (customerIds.length > 0) {
        const { count: queueCount } = await supabase
          .from("queue_tickets")
          .select("id", { count: "exact", head: true })
          .in("customer_id", customerIds)
          .in("status", ["done", "paid"]);
        if ((queueCount ?? 0) > 0) canReview = true;

        if (!canReview) {
          const { count: apptCount } = await supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .in("customer_id", customerIds)
            .eq("status", "completed");
          if ((apptCount ?? 0) > 0) canReview = true;
        }
      }
    }
  } catch {
    // Non-critical — treat as unauthenticated
  }

  const primaryBranch = branches[0];
  const acceptsBookings = branches.some((b) => b.accepts_online_bookings);
  const acceptsWalkin = branches.some((b) => b.accepts_walkin_queue);
  // Use the first walk-in enabled branch's token for the Join Queue link

  function getMapsUrl(address: string | null): string | null {
    if (!address) return null;
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  }

  function getTodayHours(operatingHours: unknown): { label: string; closed: boolean } | null {
    if (!operatingHours || typeof operatingHours !== "object") return null;
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()]!;
    const hours = (operatingHours as Record<string, { open?: string; close?: string; closed?: boolean }>)[today];
    if (!hours || hours.closed) return { label: "Closed today", closed: true };
    if (hours.open && hours.close) return { label: `${hours.open} – ${hours.close}`, closed: false };
    return null;
  }

  const todayHours = primaryBranch ? getTodayHours(primaryBranch.operating_hours) : null;
  const primaryAddress = primaryBranch?.address ?? null;
  const mapsUrl = getMapsUrl(primaryAddress);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero: full-bleed carousel with logo overlay ── */}
        <div className="relative">
          {shopImageUrls.length > 0 ? (
            <>
              <ShopImageCarousel images={shopImageUrls} shopName={tenant.name} />
              {/* Logo badge overlaid bottom-left of carousel */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white/20 bg-black/60 shadow-lg backdrop-blur-sm">
                  {tenantLogoUrl ? (
                    <img
                      src={`${STORAGE_URL}/${tenantLogoUrl}`}
                      alt={`${tenant.name} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Scissors className="h-7 w-7 text-primary" />
                  )}
                </div>
                <div className="rounded-xl bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <p className="text-sm font-bold text-white">{tenant.name}</p>
                  {todayHours && (
                    <p className={`text-[11px] font-medium ${todayHours.closed ? "text-red-400" : "text-emerald-400"}`}>
                      {todayHours.label}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No images — show a gradient placeholder with logo */
            <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/5 to-background sm:h-52">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 shadow-lg">
                    {tenantLogoUrl ? (
                      <img
                        src={`${STORAGE_URL}/${tenantLogoUrl}`}
                        alt={`${tenant.name} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Scissors className="h-9 w-9 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl">

            {/* ── Booking success banner ── */}
            {booked === "true" && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-primary">Booking Confirmed!</p>
                  <p className="text-sm text-muted-foreground">
                    Your appointment at {tenant.name} has been booked.
                  </p>
                </div>
                <Link href="/profile" className="ml-auto shrink-0 text-sm text-primary hover:underline">
                  View →
                </Link>
              </div>
            )}

            {/* ── Shop title + meta ── */}
            <div className="mt-6">
              <h1 className="text-2xl font-bold sm:text-3xl">{tenant.name}</h1>

              {/* Address */}
              {primaryAddress && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {primaryAddress}
                  </span>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <Navigation className="h-3 w-3" />
                      Directions
                    </a>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {staffCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {staffCount} barber{staffCount !== 1 ? "s" : ""}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> {services.length} service{services.length !== 1 ? "s" : ""}
                </span>
                {avgRating !== null && (
                  <span className="flex items-center gap-1 font-medium text-primary">
                    ★ {avgRating.toFixed(1)}
                    <span className="font-normal text-muted-foreground">({reviews.length})</span>
                  </span>
                )}
              </div>

              {/* Feature badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                {acceptsBookings ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <CalendarCheck className="h-3 w-3" /> Online Booking
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Ban className="h-3 w-3" /> No Online Booking
                  </span>
                )}
                {acceptsWalkin ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Hash className="h-3 w-3" /> Walk-in Queue
                    {activeQueueCount > 0 && (
                      <span className="ml-0.5 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        {activeQueueCount} in queue
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Ban className="h-3 w-3" /> No Walk-ins
                  </span>
                )}
              </div>
            </div>

            {/* ── Primary CTA buttons ── */}
            <div className="mt-5 flex flex-col gap-3">
              {acceptsBookings && (
                <div>
                  <Link
                    href={`/shop/${slug}/book`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Book Appointment
                  </Link>
                </div>
              )}

              {acceptsWalkin && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Walk-in Queue</p>
                    <p className="text-xs text-muted-foreground">
                      Scan the QR code at the shop entrance to join the queue.
                      {activeQueueCount > 0 && (
                        <span className="ml-1 font-medium text-primary">
                          {activeQueueCount} currently in queue.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {!acceptsBookings && !acceptsWalkin && (
                <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-5 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed">
                  <Ban className="h-4 w-4" /> Currently unavailable
                </span>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="mt-10 border-t border-border" />

            {/* ── Services ── */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold">Services</h2>
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service.id}
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground"
                    >
                      {service.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No services listed yet.</p>
              )}
            </div>

            {/* ── Multiple branches ── */}
            {branches.length > 1 && (
              <div className="mt-10">
                <div className="mb-4 border-t border-border pt-8">
                  <h2 className="text-lg font-semibold">Branches</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {branches.map((branch) => {
                    const bHours = getTodayHours(branch.operating_hours);
                    const bMapsUrl = getMapsUrl(branch.address);
                    return (
                      <div key={branch.id} className="rounded-xl border border-border bg-card p-4">
                        <p className="font-medium">{branch.name}</p>
                        {branch.address && (
                          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {branch.address}
                          </p>
                        )}
                        {bHours && (
                          <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${bHours.closed ? "text-destructive" : "text-primary"}`}>
                            <Clock className="h-3 w-3" />
                            {bHours.label}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {bMapsUrl && (
                            <a
                              href={bMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              <Navigation className="h-3 w-3" />
                              Directions
                            </a>
                          )}
                          {branch.accepts_walkin_queue && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                              <QrCode className="h-3 w-3" />
                              Scan QR to join queue
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Reviews ── */}
            <div className="mt-10 border-t border-border pt-8">
              <ReviewsSection
                slug={slug}
                isLoggedIn={isLoggedIn}
                canReview={canReview}
                initialReviews={reviews.map((r) => ({
                  id: r.id,
                  reviewer_name: r.reviewer_name,
                  rating: r.rating,
                  comment: r.comment,
                  created_at: r.created_at,
                }))}
              />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
