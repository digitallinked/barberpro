import { Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{ q?: string; action?: string; range?: string }>;
};

type LogRow = {
  id: string;
  action: string;
  actor_email: string;
  actor_role: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  "tenant.suspend": "Tenant Suspended",
  "tenant.unsuspend": "Tenant Reactivated",
  "blog.publish": "Blog Post Published",
  "blog.delete": "Blog Post Deleted",
  "announcement.send": "Announcement Sent",
  "settings.update": "Setting Updated",
  "staff.add": "Staff Added",
  "staff.toggle": "Staff Toggled",
  "user.toggle_active": "User Toggled",
};

const ACTION_COLORS: Record<string, string> = {
  "tenant.suspend": "text-red-400",
  "tenant.unsuspend": "text-green-400",
  "blog.publish": "text-primary",
  "blog.delete": "text-red-400",
  "announcement.send": "text-yellow-400",
  "settings.update": "text-blue-400",
};

export default async function AuditLogsPage({ searchParams }: PageProps) {
  await requireAccess("/audit-logs");
  const { q, action: actionFilter, range = "7" } = await searchParams;

  const days = range === "30" ? 30 : range === "90" ? 90 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();

  let query = supabase
    .from("admin_audit_logs")
    .select("id, action, actor_email, actor_role, target_type, target_id, metadata, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(`action.ilike.%${q}%,actor_email.ilike.%${q}%`);
  }
  if (actionFilter) {
    query = query.eq("action", actionFilter);
  }

  const { data, error } = await query;
  const logs = (data ?? []) as LogRow[];

  const RANGES = [
    { label: "7 days", value: "7" },
    { label: "30 days", value: "30" },
    { label: "90 days", value: "90" },
  ];

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Logs"
        description="Track sensitive actions and administrative changes"
      >
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/audit-logs?range=${r.value}${q ? `&q=${q}` : ""}${actionFilter ? `&action=${actionFilter}` : ""}`}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                range === r.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by action or actor email…"
            className="h-9 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          {uniqueActions.map((a) => (
            <Link
              key={a}
              href={`/audit-logs?action=${a}&range=${range}${q ? `&q=${q}` : ""}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                actionFilter === a
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {ACTION_LABELS[a] ?? a}
            </Link>
          ))}
          {actionFilter && (
            <Link
              href={`/audit-logs?range=${range}${q ? `&q=${q}` : ""}`}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50"
            >
              Clear
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error.message} — The admin_audit_logs table may not exist yet. Run the latest migration to create it.
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-medium">{logs.length} events</p>
        </div>
        <div className="divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4 px-5 py-3">
              <div className="flex flex-col gap-1">
                <p className={`text-sm font-medium ${ACTION_COLORS[log.action] ?? ""}`}>
                  {ACTION_LABELS[log.action] ?? log.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  by <span className="font-medium text-foreground/80">{log.actor_email}</span>
                  {" · "}
                  <span className="capitalize">{log.actor_role.replace(/_/g, " ")}</span>
                  {log.target_type && log.target_id && (
                    <>
                      {" → "}
                      <span className="capitalize">{log.target_type}</span>{" "}
                      <code className="rounded bg-muted px-1 text-[10px]">{log.target_id.slice(0, 8)}…</code>
                    </>
                  )}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        {logs.length === 0 && !error && (
          <EmptyState
            icon={ShieldCheck}
            title="No audit events"
            description="Admin actions will appear here once recorded"
            className="border-t border-border"
          />
        )}
      </div>
    </div>
  );
}
