import { notFound } from "next/navigation";
import Link from "next/link";
import { Scissors } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { QueueTracker } from "./queue-tracker";

type Props = {
  params: Promise<{ ticketId: string }>;
};

export default async function QueuePage({ params }: Props) {
  const { ticketId } = await params;
  const supabase = createAdminClient();

  const { data: ticket } = await supabase
    .from("queue_tickets")
    .select("id, queue_number, status, branch_id, branches(name, tenant_id, tenants(name, slug))")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) notFound();

  const branch = ticket.branches as {
    name: string;
    tenant_id: string;
    tenants: { name: string; slug: string } | null;
  } | null;

  const tenantName = (branch?.tenants as { name: string; slug: string } | null)?.name ?? "Barbershop";
  const tenantSlug = (branch?.tenants as { name: string; slug: string } | null)?.slug ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Minimal header */}
      <header className="border-b border-border/60 px-6 py-4">
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">
              BarberPro<span className="text-primary">.my</span>
            </span>
          </Link>
          {tenantSlug && (
            <Link
              href={`/shop/${tenantSlug}`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {tenantName} →
            </Link>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <p className="text-lg font-bold">{tenantName}</p>
            <p className="text-sm text-muted-foreground">{branch?.name ?? ""}</p>
          </div>

          <QueueTracker
            ticketId={ticket.id}
            initialQueueNumber={Number(ticket.queue_number)}
            initialStatus={ticket.status}
            branchId={ticket.branch_id}
            supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
            supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
          />
        </div>
      </main>
    </div>
  );
}
