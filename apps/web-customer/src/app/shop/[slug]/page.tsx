import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, MapPin, Users, Scissors, CalendarCheck, CheckCircle2, ArrowRight, Hash, Ban } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

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
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!tenant) notFound();

  const [branchesResult, servicesResult, staffResult, queueResult] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, address, operating_hours, accepts_online_bookings, accepts_walkin_queue")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true),
    supabase
      .from("services")
      .select("id, name, price, duration_min, is_active")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("staff_profiles")
      .select("id, user_id, app_users(full_name)")
      .eq("tenant_id", tenant.id),
    supabase
      .from("queue_tickets")
      .select("id, status, branch_id", { count: "exact", head: false })
      .eq("tenant_id", tenant.id)
      .in("status", ["waiting", "in_service"])
      .limit(1),
  ]);

  const branches = branchesResult.data ?? [];
  const services = servicesResult.data ?? [];
  const staff = staffResult.data ?? [];
  const activeQueueCount = queueResult.count ?? 0;

  // Determine shop-level mode from primary branch
  const primaryBranch = branches[0];
  const acceptsBookings = branches.some((b) => b.accepts_online_bookings);
  const acceptsWalkin = branches.some((b) => b.accepts_walkin_queue);

  // Determine if shop is open today based on operating_hours
  function getTodayHours(operatingHours: unknown): string | null {
    if (!operatingHours || typeof operatingHours !== "object") return null;
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()]!;
    const hours = (operatingHours as Record<string, { open?: string; close?: string; closed?: boolean }>)[today];
    if (!hours || hours.closed) return "Closed today";
    if (hours.open && hours.close) return `${hours.open} – ${hours.close}`;
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          {/* Booking success banner */}
          {booked === "true" && (
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-primary">Booking Confirmed!</p>
                <p className="text-sm text-muted-foreground">
                  Your appointment at {tenant.name} has been booked. Check your profile for details.
                </p>
              </div>
              <Link href="/profile" className="ml-auto shrink-0 text-sm text-primary hover:underline">
                View →
              </Link>
            </div>
          )}

          {/* Shop header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Scissors className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">{tenant.name}</h1>

              {branches.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{branches[0]?.address || "—"}</span>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {staff.length} barbers
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {services.length} services
                </span>
                {primaryBranch && (() => {
                  const todayHours = getTodayHours(primaryBranch.operating_hours);
                  return todayHours ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className={todayHours === "Closed today" ? "text-destructive" : "text-primary"}>
                        {todayHours}
                      </span>
                    </span>
                  ) : null;
                })()}
              </div>

              {/* Mode + queue badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                {acceptsBookings ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <CalendarCheck className="h-3 w-3" /> Online Booking
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground line-through">
                    <Ban className="h-3 w-3" /> No Online Booking
                  </span>
                )}
                {acceptsWalkin ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Hash className="h-3 w-3" /> Walk-in Queue
                    {activeQueueCount > 0 && (
                      <span className="ml-1 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        {activeQueueCount} in queue
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground line-through">
                    <Ban className="h-3 w-3" /> No Walk-ins
                  </span>
                )}
              </div>
            </div>

            {acceptsBookings ? (
              <Link
                href={`/shop/${slug}/book`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:self-start"
              >
                <CalendarCheck className="h-4 w-4" />
                Book Appointment
              </Link>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-muted px-6 py-3 font-semibold text-muted-foreground sm:self-start cursor-not-allowed">
                <Ban className="h-4 w-4" />
                Booking Unavailable
              </span>
            )}
          </div>

          {/* Services */}
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">Services</h2>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {services.map((service, i) => (
                <div
                  key={service.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < services.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration_min} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">RM {Number(service.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No services listed yet
                </div>
              )}
            </div>
          </div>

          {/* Barbers */}
          {staff.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Our Barbers</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {staff.map((barber) => {
                  const appUser = barber.app_users as { full_name: string } | null;
                  const name = appUser?.full_name ?? "Barber";
                  const initials = name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();
                  return (
                    <div
                      key={barber.id}
                      className="rounded-xl border border-border bg-card p-4 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">{initials}</span>
                      </div>
                      <p className="mt-3 font-medium">{name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multiple branches */}
          {branches.length > 1 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Branches</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {branches.map((branch) => {
                  const todayHours = getTodayHours(branch.operating_hours);
                  return (
                    <div key={branch.id} className="rounded-xl border border-border bg-card p-4">
                      <p className="font-medium">{branch.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {branch.address || "—"}
                      </p>
                      {todayHours && (
                        <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${todayHours === "Closed today" ? "text-destructive" : "text-primary"}`}>
                          <Clock className="h-3 w-3" />
                          {todayHours}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            {acceptsBookings && acceptsWalkin ? (
              <>
                <h3 className="text-lg font-semibold">Ready to visit?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book an appointment or walk in and join the queue.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={`/shop/${slug}/book`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <CalendarCheck className="h-4 w-4" /> Book Appointment
                  </Link>
                  <span className="text-sm text-muted-foreground">or walk in & scan QR</span>
                </div>
              </>
            ) : acceptsBookings ? (
              <>
                <h3 className="text-lg font-semibold">Book your appointment</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tenant.name} accepts appointments only — no walk-ins.
                </p>
                <Link
                  href={`/shop/${slug}/book`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Book Now <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : acceptsWalkin ? (
              <>
                <h3 className="text-lg font-semibold">Walk-ins welcome</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tenant.name} only accepts walk-in customers. Visit the shop and scan the QR code to join the queue.
                  {activeQueueCount > 0 && ` There ${activeQueueCount === 1 ? "is" : "are"} currently ${activeQueueCount} customer${activeQueueCount === 1 ? "" : "s"} in queue.`}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">Currently closed to new customers</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This shop is not accepting bookings or walk-ins right now. Please check back later.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
