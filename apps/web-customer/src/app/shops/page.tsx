import type { Metadata } from "next";

import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSiteOrigin } from "@/lib/site-url";
import { ShopsGrid } from "./shops-grid";
import { ShopsHeader } from "./shops-header";

export const revalidate = 60;

const SHOPS_TITLE = "Cari kedai gunting berhampiran | BarberPro";
const SHOPS_DESC =
  "Terokai kedai barber dan gunting rambut aktif di BarberPro Malaysia — lokasi sebenar, tempahan dalam talian, dan giliran masa nyata.";

export const metadata: Metadata = {
  title: SHOPS_TITLE,
  description: SHOPS_DESC,
  alternates: { canonical: `${getSiteOrigin()}/shops` },
  openGraph: {
    title: SHOPS_TITLE,
    description: SHOPS_DESC,
    type: "website",
    url: `${getSiteOrigin()}/shops`,
    locale: "ms_MY",
    siteName: "BarberPro",
  },
  twitter: {
    card: "summary_large_image",
    title: SHOPS_TITLE,
    description: SHOPS_DESC,
  },
};

export default async function ShopsPage() {
  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url, created_at, branches(id, name, address, logo_url, latitude, longitude)")
    .eq("status", "active")
    .in("subscription_status", ["active", "trialing"])
    .order("name");

  const shops = (tenants ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    logo_url: t.logo_url ?? null,
    branches: ((t.branches ?? []) as unknown as {
      id: string;
      name: string;
      address: string | null;
      logo_url: string | null;
      latitude: number | null;
      longitude: number | null;
    }[]),
  }));

  // Count individual branch locations (each branch = one card in the grid)
  const locationCount = shops.reduce(
    (sum, s) => sum + Math.max(s.branches.length, 1),
    0
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <ShopsHeader count={locationCount} />

          <ShopsGrid shops={shops} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
