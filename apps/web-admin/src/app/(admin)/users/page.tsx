import { Search, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{ q?: string; role?: string; active?: string }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAccess("/users");
  const { q, role: roleFilter, active: activeFilter } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("app_users")
    .select("id, full_name, email, role, is_active, created_at, tenant_id, tenants(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }
  if (activeFilter !== undefined) {
    query = query.eq("is_active", activeFilter === "true");
  }

  const { data: users, error } = await query;

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">
        Failed to load users: {error.message}
      </div>
    );
  }

  type AppUserRow = {
    id: string;
    full_name: string;
    email: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
    tenant_id: string | null;
    tenants: { name: string } | null;
  };

  const userRows = (users ?? []) as AppUserRow[];
  const totalActive = userRows.filter((u) => u.is_active).length;
  const totalInactive = userRows.filter((u) => !u.is_active).length;

  const ROLES = ["owner", "manager", "cashier", "barber", "receptionist"];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="All platform users across all tenants"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Shown" value={userRows.length} />
        <StatCard label="Active" value={totalActive} accent="success" />
        <StatCard label="Inactive" value={totalInactive} accent={totalInactive > 0 ? "warning" : "default"} />
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="h-9 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <a
              key={r}
              href={`/users?role=${r}${q ? `&q=${q}` : ""}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                roleFilter === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {r}
            </a>
          ))}
          {roleFilter && (
            <a
              href="/users"
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50"
            >
              Clear
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <a
            href={`/users?active=true${q ? `&q=${q}` : ""}${roleFilter ? `&role=${roleFilter}` : ""}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === "true"
                ? "border-green-500/50 bg-green-500/10 text-green-400"
                : "border-border text-muted-foreground hover:border-green-500/30"
            }`}
          >
            Active only
          </a>
          <a
            href={`/users?active=false${q ? `&q=${q}` : ""}${roleFilter ? `&role=${roleFilter}` : ""}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === "false"
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-border text-muted-foreground hover:border-red-500/30"
            }`}
          >
            Inactive only
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shop</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {userRows.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{user.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.tenants?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs ${
                      user.is_active ? "text-green-400" : "text-muted-foreground"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-green-400" : "bg-muted-foreground"}`} />
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {userRows.length === 0 && (
          <EmptyState
            icon={Users}
            title="No users found"
            description={q ? `No results for "${q}"` : "No users match the current filter"}
            className="border-t border-border"
          />
        )}
      </div>
    </div>
  );
}
