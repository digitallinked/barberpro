import Link from "next/link";
import { Scissors } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import { BottomNav } from "./bottom-nav";
import { ProfileMenu } from "./profile-menu";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customerName: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    const { data: customer } = (await (supabase as any)
      .from("customer_accounts")
      .select("full_name")
      .eq("auth_user_id", user.id)
      .maybeSingle()) as { data: { full_name: string } | null };

    customerName = customer?.full_name ?? user.email ?? null;
    // Pull avatar from OAuth provider metadata (e.g. Google sign-in)
    avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0d1013]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4af37]/20">
              <Scissors className="h-4 w-4 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">
                BarberPro<span className="text-[#d4af37]">.my</span>
              </p>
              <p className="hidden text-[9px] font-semibold uppercase tracking-wider text-gray-500 sm:block">
                Malaysia&apos;s #1 Barber Platform
              </p>
            </div>
          </Link>

          {/* Desktop nav links — center */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/shops"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
            >
              Find Shops
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
            >
              How It Works
            </Link>
            <Link
              href="/styles"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
            >
              Styles
            </Link>
            <Link
              href="/subscription"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
            >
              Plus
            </Link>
          </nav>

          {/* Profile menu — visible on all screen sizes */}
          <ProfileMenu
            isLoggedIn={!!user}
            customerName={customerName}
            avatarUrl={avatarUrl}
          />
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <BottomNav isLoggedIn={!!user} customerName={customerName} />
    </>
  );
}
