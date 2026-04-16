import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Clock, MapPin, Scissors, CalendarCheck, CheckCircle2,
  Hash, Ban, Navigation, Users, Sparkles, QrCode,
} from "lucide-react";


import { shopMediaDisplayUrl } from "@barberpro/db/shop-media";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { shopCalendarDateString } from "@/lib/shop-day";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ShopImageCarousel } from "@/components/shop-image-carousel";
import { ReviewsSection } from "@/components/reviews-section";
import { getSiteOrigin } from "@/lib/site-url";

export const revalidate = 60;

async function resolveShopSeo(slug: string) {
  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .eq("status", "active")
    .in("subscription_status", ["active", "trialing"])
    .maybeSingle();

  if (!tenant) return null;

  const { data: branches } = await supabase
    .from("branches")
    .select("address, logo_url")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("is_hq", { ascending: false })
    .limit(1);

  const primary = branches?.[0];
  const address = primary?.address ?? null;
  const logoUrl = primary?.logo_url ?? tenant.logo_url ?? null;
  return { tenant, address, logoUrl };
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booked?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveShopSeo(slug);
  if (!resolved) {
    return { title: "Kedai tidak dijumpai | BarberPro" };
  }

  const { tenant, address, logoUrl } = resolved;
  const site = getSiteOrigin();
  const url = `${site}/shop/${tenant.slug}`;
  const title = `${tenant.name} — Tempah & giliran di BarberPro`;
  const description = address
    ? `${tenant.name} di BarberPro. ${address.length > 155 ? `${address.slice(0, 152)}…` : address}. Tempah online & sertai giliran.`
    : `Tempah temujanji dan sertai giliran di ${tenant.name} melalui BarberPro Malaysia.`;

  const ogImages = logoUrl
    ? [
        {
          url: shopMediaDisplayUrl(logoUrl, { width: 1200, quality: 88 }),
          width: 1200,
          height: 630,
          alt: tenant.name,
        },
      ]
    : [];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      locale: "ms_MY",
      siteName: "BarberPro",
      images: ogImages,
    },
    twitter: {
      card: ogImages.length ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImages.length ? { images: [ogImages[0]!.url] } : {}),
    },
  };
}

export default async function ShopProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { booked } = await searchParams;
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .eq("status", "active")
    .in("subscription_status", ["active", "trialing"])
    .maybeSingle();

  if (!tenant) notFound();

  // Prefer HQ branch logo; fall back to tenant brand logo

  const [branchesResult, servicesResult, staffResult, queueResult, branchImagesResult, tenantImagesResult, reviewsResult] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id, name, address, logo_url, operating_hours, accepts_online_bookings, accepts_walkin_queue, checkin_token")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("is_hq", { ascending: false }),
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
        .from("branch_images")
        .select("storage_path, branch_id")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true }),
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
  const reviews = reviewsResult.data ?? [];

  // Prefer branch_images (new); fall back to tenant_images (legacy) if no branch photos yet
  const branchImagePaths = branchImagesResult.data ?? [];
  const tenantImagePaths = tenantImagesResult.data ?? [];
  const shopImageUrls = (
    branchImagePaths.length > 0 ? branchImagePaths : tenantImagePaths
  ).map((img) =>
    shopMediaDisplayUrl(img.storage_path, { width: 1600, quality: 88 })
  );

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
  // HQ branch logo → tenant logo → null
  const resolvedLogoUrl =
    (primaryBranch as typeof primaryBranch & { logo_url?: string | null })?.logo_url ??
    tenant.logo_url ??
    null;
  const acceptsBookings = branches.some((b) => b.accepts_online_bookings);
  const acceptsWalkin = branches.some((b) => b.accepts_walkin_queue);
  // Use the first walk-in enabled branch's token for the Join Queue link

  function getMapsUrl(address: string | null): string | null {
    if (!address) return null;
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  }

  function getTodayHours(operatingHours: unknown): { label: string; closed: boolean } | null {
    if (!operatingHours || typeof operatingHours !== "object") return null;
    const lowerDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const capitalDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const idx = new Date().getDay();
    const oh = operatingHours as Record<string, unknown>;
    // Try lowercase key first (legacy format), then capitalized (new format from edit modal)
    const entry = oh[lowerDays[idx]!] ?? oh[capitalDays[idx]!];
    if (entry === undefined || entry === null) return null;
    // Object format: { open: "09:00", close: "22:00", closed: false }
    if (typeof entry === "object") {
      const h = entry as { open?: string; close?: string; closed?: boolean };
      if (h.closed) return { label: "Closed today", closed: true };
      if (h.open && h.close) return { label: `${h.open} – ${h.close}`, closed: false };
    }
    // String format: "09:00 - 22:00" or "Closed"
    if (typeof entry === "string") {
      if (entry.toLowerCase() === "closed") return { label: "Closed today", closed: true };
      const parts = entry.split(" - ");
      if (parts.length >= 2) return { label: `${parts[0]} – ${parts[1]}`, closed: false };
    }
    return null;
  }

  const todayHours = primaryBranch ? getTodayHours(primaryBranch.operating_hours) : null;
  const primaryAddress = primaryBranch?.address ?? null;
  const mapsUrl = getMapsUrl(primaryAddress);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const shopPageUrl = `${getSiteOrigin()}/shop/${slug}`;
  const primarySchemaImage =
    shopImageUrls[0] ??
    (resolvedLogoUrl
      ? shopMediaDisplayUrl(resolvedLogoUrl, { width: 1200, quality: 88 })
      : undefined);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: tenant.name,
    url: shopPageUrl,
    ...(primarySchemaImage ? { image: primarySchemaImage } : {}),
    ...(primaryAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: primaryAddress,
            addressCountry: "MY",
          },
        }
      : {}),
    ...(avgRating !== null && reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="flex-1">
        <div className="px-4 pt-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {/* ── Photo strip: short, inset, same width as content ── */}
            {shopImageUrls.length > 0 ? (
              <ShopImageCarousel images={shopImageUrls} shopName={tenant.name} />
            ) : (
              <div className="aspect-[21/9] max-h-[min(200px,34vh)] rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-background sm:max-h-[240px] md:max-h-[260px]" />
            )}

            {/* ── Brand row: no overlap with hero; logo scales with title ── */}
            <div className="mt-5 flex items-start gap-4 sm:mt-6 sm:gap-5">
              <div className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-md sm:h-28 sm:w-28">
                {resolvedLogoUrl ? (
                  <img
                    src={shopMediaDisplayUrl(resolvedLogoUrl, { width: 384, quality: 90 })}
                    alt={`${tenant.name} logo`}
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <Scissors className="h-12 w-12 text-primary sm:h-14 sm:w-14" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  {tenant.name}
                </h1>
                {todayHours && (
                  <p
                    className={`mt-1.5 text-sm font-medium ${todayHours.closed ? "text-destructive" : "text-primary"}`}
                  >
                    {todayHours.closed ? "Closed today" : `Today · ${todayHours.label}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-16 sm:px-6">
          <div className="mx-auto mt-6 max-w-3xl">

            {/* ── Booking success banner ── */}
            {booked === "true" && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
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

            {/* ── Shop meta ── */}
            <div>

              {/* Address */}
              {primaryAddress && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
