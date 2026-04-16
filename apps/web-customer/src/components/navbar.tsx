import Link from "next/link";
import { Scissors } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import { BottomNav } from "./bottom-nav";
import { NavDesktopLinks } from "./nav-desktop-links";
import { NavbarHeaderShell } from "./navbar-header-shell";
import { NotificationBell } from "./notification-bell";
import { ProfileMenu } from "./profile-menu";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customerName: string | null = null;
  let avatarUrl: string | null = null;
  let isShopUser = false;

  if (user) {
    const [{ data: customer }, { data: appUser }] = await Promise.all([
      (supabase as any)
        .from("customer_accounts")
        .select("full_name")
        .eq("auth_user_id", user.id)
        .maybeSingle() as Promise<{ data: { full_name: string } | null }>,
      (supabase as any)
        .from("app_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .maybeSingle() as Promise<{ data: { id: string } | null }>,
    ]);

    customerName = customer?.full_name ?? user.email ?? null;
    avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null;
    isShopUser = !!appUser;
  }

  return (
    <>
      <NavbarHeaderShell>
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

          {/* Desktop nav links + language switcher — center */}
          <NavDesktopLinks />

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            {!!user && <NotificationBell />}
            <ProfileMenu
              isLoggedIn={!!user}
              customerName={customerName}
              avatarUrl={avatarUrl}
              isShopUser={isShopUser}
            />
          </div>
        </div>
      </NavbarHeaderShell>

      {/* Mobile bottom navigation */}
      <BottomNav isLoggedIn={!!user} customerName={customerName} />
    </>
  );
}
