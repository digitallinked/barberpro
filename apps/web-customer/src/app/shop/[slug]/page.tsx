import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, MapPin, Users, Scissors, CalendarCheck, CheckCircle2, ArrowRight } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";

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

  const [branchesResult, servicesResult, staffResult] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, address, operating_hours")
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
  ]);

  const branches = branchesResult.data ?? [];
  const services = servicesResult.data ?? [];
  const staff = staffResult.data ?? [];

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

              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {staff.length} barbers
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {services.length} services
                </span>
              </div>
            </div>

            <Link
              href={`/shop/${slug}/book`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:self-start"
            >
              <CalendarCheck className="h-4 w-4" />
              Book Appointment
            </Link>
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
                  return (
                    <div
                      key={barber.id}
                      className="rounded-xl border border-border bg-card p-4 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <p className="mt-3 font-medium">{appUser?.full_name ?? "Barber"}</p>
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
                {branches.map((branch) => (
                  <div key={branch.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-medium">{branch.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {branch.address || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book CTA */}
          <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-semibold">Ready to book?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Secure your spot at {tenant.name} in just a few taps.
            </p>
            <Link
              href={`/shop/${slug}/book`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Book Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 px-6 py-6">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} BarberPro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
