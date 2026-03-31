import Link from "next/link";
import { MapPin } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export default async function ShopsPage() {
  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, created_at, branches(id, name, address, city)")
    .eq("status", "active")
    .in("subscription_status", ["active", "trialing"])
    .order("name");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">BarberPro</Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">Find a Barbershop</h1>
          <p className="mt-2 text-muted-foreground">
            {tenants?.length ?? 0} shops registered on BarberPro
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tenants?.map((tenant) => {
              const branches = (tenant.branches ?? []) as { id: string; name: string; address: string | null; city: string | null }[];
              const primaryBranch = branches[0];

              return (
                <Link
                  key={tenant.id}
                  href={`/shop/${tenant.slug}`}
                  className="group rounded-lg border border-border p-5 transition-colors hover:border-accent/50 hover:bg-accent/5"
                >
                  <h3 className="text-lg font-semibold group-hover:text-accent">{tenant.name}</h3>
                  {primaryBranch && (
                    <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{primaryBranch.city || primaryBranch.address || "—"}</span>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {branches.length} {branches.length === 1 ? "branch" : "branches"}
                  </p>
                </Link>
              );
            })}

            {(!tenants || tenants.length === 0) && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                No barbershops found yet. Check back soon!
              </div>
            )}
          </div>
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
