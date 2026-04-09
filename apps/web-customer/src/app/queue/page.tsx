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
    const { data: customerAccount } = await (supabase as any)
      .from("customer_accounts")
      .select("email")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const userEmail =
      ((customerAccount as { email?: string } | null)?.email) ?? user.email ?? "";

    const [crmByEmailResult, crmByAccountRaw] = await Promise.all([
      userEmail
        ? admin.from("customers").select("id").eq("phone", userEmail)
        : Promise.resolve({ data: null as { id: string }[] | null }),
      (admin as any).from("customer_accounts").select("customer_id").eq("auth_user_id", user.id),
    ]);

    const crmByEmail = crmByEmailResult.data;
    const crmByAccount = crmByAccountRaw.data as Array<{ customer_id: string | null }> | null;
    const crmIds = Array.from(
      new Set([
        ...(crmByEmail ?? []).map((c: { id: string }) => c.id),
        ...(crmByAccount ?? [])
          .map((c) => c.customer_id)
          .filter((id): id is string => !!id),
      ])
    );

    const selectQueue =
      "id, queue_number, status, created_at, notes, branches(name, tenants(name, slug))";

    const [byCrm, byPhone] = await Promise.all([
      crmIds.length > 0
        ? admin
            .from("queue_tickets")
            .select(selectQueue)
            .in("customer_id", crmIds)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: null }),
      userEmail
        ? (admin as any)
            .from("queue_tickets")
            .select(selectQueue)
            .eq("customer_phone", userEmail)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: null }),
    ]);

    const merged = new Map<string, QueueTicket>();
    for (const row of [...(byCrm.data ?? []), ...(byPhone.data ?? [])]) {
      const t = row as QueueTicket;
      merged.set(t.id, t);
    }
    queueTickets = Array.from(merged.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
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
