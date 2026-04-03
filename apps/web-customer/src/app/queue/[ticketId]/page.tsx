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
  const branchName = branch?.name ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Minimal header */}
      <header className="border-b border-white/8 px-6 py-4">
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D4AF37]">
              <Scissors className="h-3.5 w-3.5 text-[#111]" />
            </div>
            <span className="text-sm font-bold text-white">
              BarberPro<span className="text-[#D4AF37]">.my</span>
            </span>
          </Link>
          {tenantSlug && (
            <Link
              href={`/shop/${tenantSlug}`}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              {tenantName} →
            </Link>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-1 text-center">
            <p className="text-base font-bold text-white">{tenantName}</p>
            <p className="text-sm text-gray-500">{branchName}</p>
          </div>

          <QueueTracker
            ticketId={ticket.id}
            queueNumber={ticket.queue_number}
            initialStatus={ticket.status}
            branchId={ticket.branch_id}
            branchName={branchName}
          />
        </div>
      </main>
    </div>
  );
}
