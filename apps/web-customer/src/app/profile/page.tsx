import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: customer } = await supabase
    .from("customer_accounts")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">BarberPro</Link>
          <nav className="flex items-center gap-4">
            <Link href="/shops" className="text-sm text-muted-foreground hover:text-foreground">
              Find Shops
            </Link>
            <span className="text-sm font-medium">{customer?.full_name || user.email}</span>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold">My Profile</h1>

          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-border p-6">
              <h2 className="font-semibold">Account Details</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{customer?.full_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{customer?.email || user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{customer?.phone || "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-6">
              <h2 className="font-semibold">Loyalty Points</h2>
              <p className="mt-2 text-3xl font-bold">{customer?.loyalty_points ?? 0}</p>
              <p className="text-sm text-muted-foreground">points available</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
