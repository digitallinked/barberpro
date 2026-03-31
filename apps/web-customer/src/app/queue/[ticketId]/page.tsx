import { notFound } from "next/navigation";

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
    .select("id, queue_number, status, branch_id, branches(name, tenant_id, tenants(name))")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) notFound();

  const branch = ticket.branches as { name: string; tenant_id: string; tenants: { name: string } | null } | null;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-lg font-semibold text-muted-foreground">
          {(branch?.tenants as { name: string } | null)?.name ?? "Barbershop"}
        </h1>
        <p className="text-sm text-muted-foreground">{branch?.name ?? ""}</p>

        <QueueTracker
          ticketId={ticket.id}
          initialQueueNumber={Number(ticket.queue_number)}
          initialStatus={ticket.status}
          branchId={ticket.branch_id}
          supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
          supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
        />
      </div>
    </div>
  );
}
