import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { QueuePanel } from "./queue-panel";

export type ShopForQueue = {
  id: string;
  name: string;
  slug: string;
  branches: { id: string; name: string; address: string | null }[];
};

export type QueueTicket = {
  id: string;
  queue_number: number | string;
  status: string;
  created_at: string;
  notes: string | null;
  branches: { name: string; tenants: { name: string; slug: string } | null } | null;
};

export default async function QueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  let queueTickets: QueueTicket[] = [];
  let shops: ShopForQueue[] = [];

  if (user) {
    const userEmail = user.email ?? "";

    // Resolve CRM customer IDs
    const [{ data: crmByEmail }, { data: crmByAccountRaw }] = await Promise.all([
      admin.from("customers").select("id").eq("phone", userEmail),
      (admin as any).from("customer_accounts").select("customer_id").eq("auth_user_id", user.id),
    ]);

    const crmByAccount = crmByAccountRaw as Array<{ customer_id: string | null }> | null;
    const crmIds = Array.from(
      new Set([
        ...(crmByEmail ?? []).map((c: { id: string }) => c.id),
        ...(crmByAccount ?? [])
          .map((c) => c.customer_id)
          .filter((id): id is string => !!id),
      ])
    );

    if (crmIds.length > 0) {
      const { data } = await admin
        .from("queue_tickets")
        .select("id, queue_number, status, created_at, notes, branches(name, tenants(name, slug))")
        .in("customer_id", crmIds)
        .order("created_at", { ascending: false })
        .limit(50) as { data: QueueTicket[] | null };
      queueTickets = data ?? [];
    }
  }

  // Always load shops for the join flow (works for both logged-in and guest)
  const { data: tenantsRaw } = await admin
    .from("tenants")
    .select("id, name, slug, branches(id, name, address, accepts_walkin_queue)")
    .eq("status", "active")
    .order("name", { ascending: true });

  type RawBranch = { id: string; name: string; address: string | null; accepts_walkin_queue: boolean };
  shops = (tenantsRaw ?? [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      branches: ((t.branches as RawBranch[] | null) ?? []).filter(
        (b) => b.id && b.accepts_walkin_queue
      ),
    }))
    .filter((t) => t.branches.length > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 pb-24 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <QueuePanel
            queueTickets={queueTickets}
            shops={shops}
            isLoggedIn={!!user}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
