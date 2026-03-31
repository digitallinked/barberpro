import Link from "next/link";
import { MapPin, Store, ArrowRight, Scissors } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";

export const revalidate = 60;

export default async function ShopsPage() {
  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, created_at, branches(id, name, address)")
    .eq("status", "active")
    .in("subscription_status", ["active", "trialing"])
    .order("name");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold sm:text-4xl">Find a Barbershop</h1>
            <p className="mt-2 text-muted-foreground">
              {tenants?.length ?? 0} verified shops on BarberPro
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tenants?.map((tenant) => {
              const branches = (tenant.branches ?? []) as { id: string; name: string; address: string | null }[];
              const primaryBranch = branches[0];

              return (
                <Link
                  key={tenant.id}
                  href={`/shop/${tenant.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">
                    {tenant.name}
                  </h3>

                  {primaryBranch && (
                    <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-2">{primaryBranch.address || "Address not listed"}</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Store className="h-3.5 w-3.5" />
                      {branches.length} {branches.length === 1 ? "branch" : "branches"}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Book Now <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}

            {(!tenants || tenants.length === 0) && (
              <div className="col-span-full rounded-xl border border-border bg-card py-20 text-center">
                <Store className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No barbershops found yet. Check back soon!</p>
              </div>
            )}
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
