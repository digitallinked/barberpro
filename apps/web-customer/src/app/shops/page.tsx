import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ShopsGrid } from "./shops-grid";
import { ShopsHeader } from "./shops-header";

export const revalidate = 60;

export default async function ShopsPage() {
  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url, created_at, branches(id, name, address)")
    .eq("status", "active")
    .in("subscription_status", ["active", "trialing"])
    .order("name");

  const shops = (tenants ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    logo_url: t.logo_url ?? null,
    branches: ((t.branches ?? []) as { id: string; name: string; address: string | null }[]),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <ShopsHeader count={shops.length} />

          <ShopsGrid shops={shops} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
