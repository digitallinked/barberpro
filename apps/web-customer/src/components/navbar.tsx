import Link from "next/link";
import { Scissors, User, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let customerName: string | null = null;
  if (user) {
    const { data: customer } = await (supabase as any)
      .from("customer_accounts")
      .select("full_name")
      .eq("auth_user_id", user.id)
      .maybeSingle() as { data: { full_name: string } | null };
    customerName = customer?.full_name ?? user.email ?? null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            BarberPro<span className="text-primary">.my</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/shops"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Find Shops
          </Link>
          <Link
            href="/how-it-works"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            How It Works
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/subscription"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Plus
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:block">{customerName?.split(" ")[0] ?? "Profile"}</span>
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">Sign Out</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
