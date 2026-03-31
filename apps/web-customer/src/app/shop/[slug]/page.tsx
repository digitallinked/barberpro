import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ShopProfilePage({ params }: Props) {
  const { slug } = await params;
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
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">BarberPro</Link>
          <nav className="flex items-center gap-4">
            <Link href="/shops" className="text-sm text-muted-foreground hover:text-foreground">
              All Shops
            </Link>
            <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">{tenant.name}</h1>

          {branches.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{branches[0]?.address || "—"}</span>
            </div>
          )}

          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {staff.length} barbers
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {services.length} services
            </span>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold">Services</h2>
            <div className="mt-4 divide-y divide-border rounded-lg border border-border">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.duration_min} min</p>
                  </div>
                  <p className="font-semibold">RM {Number(service.price).toFixed(2)}</p>
                </div>
              ))}
              {services.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No services listed yet
                </div>
              )}
            </div>
          </div>

          {staff.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Barbers</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {staff.map((barber) => {
                  const appUser = barber.app_users as { full_name: string } | null;
                  return (
                    <div key={barber.id} className="rounded-lg border border-border p-4 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="mt-2 font-medium">{appUser?.full_name ?? "Barber"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {branches.length > 1 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Branches</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {branches.map((branch) => (
                  <div key={branch.id} className="rounded-lg border border-border p-4">
                    <p className="font-medium">{branch.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{branch.address || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} BarberPro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
