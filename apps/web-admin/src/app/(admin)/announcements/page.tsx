import { AlertTriangle, Info, Megaphone, Zap } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAnnouncement } from "./actions";

type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  sent_by: string | null;
  sent_at: string;
};

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  info: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", icon: Info },
  warning: { bg: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-400", icon: AlertTriangle },
  critical: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: Zap },
};

export default async function AnnouncementsPage() {
  const role = await requireAccess("/announcements");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, message, type, target, sent_by, sent_at")
    .order("sent_at", { ascending: false })
    .limit(50);

  const announcements = (data ?? []) as AnnouncementRow[];
  const isSuperAdmin = role === "super_admin";

  const TARGET_OPTIONS = [
    { value: "all", label: "All tenants" },
    { value: "plan:starter", label: "Starter plan" },
    { value: "plan:basic", label: "Basic plan" },
    { value: "plan:pro", label: "Pro plan" },
    { value: "plan:enterprise", label: "Enterprise plan" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Announcements"
        description="Broadcast messages to platform tenants"
      />

      {error && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400">
          Could not load announcements. Run migration 20260402140000 first.
        </div>
      )}

      {/* Compose form */}
      {isSuperAdmin && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Send Announcement</h2>
          </div>
          <form action={sendAnnouncement as (formData: FormData) => void} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-xs font-medium text-muted-foreground">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="Announcement title…"
                  className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="type" className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    id="type"
                    name="type"
                    defaultValue="info"
                    className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="target" className="text-xs font-medium text-muted-foreground">Audience</label>
                  <select
                    id="target"
                    name="target"
                    defaultValue="all"
                    className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {TARGET_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-xs font-medium text-muted-foreground">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder="Write your announcement message…"
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Send Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">History</h2>
        <div className="space-y-3">
          {announcements.map((a) => {
            const style = TYPE_STYLES[a.type] ?? TYPE_STYLES.info;
            const Icon = style.icon;
            return (
              <div
                key={a.id}
                className={`rounded-lg border p-4 ${style.bg}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className={`rounded-full border px-2 py-0.5 capitalize font-medium ${style.bg} ${style.text}`}>
                          {a.type}
                        </span>
                        <span>→ {a.target.replace("plan:", "").replace("all", "All tenants")}</span>
                        {a.sent_by && <span>by {a.sent_by}</span>}
                        <span>{new Date(a.sent_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {announcements.length === 0 && !error && (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Broadcast messages will appear here after you send them"
          />
        )}
      </div>
    </div>
  );
}
