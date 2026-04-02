import { UserPlus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_ADMIN_ROLES, ROLE_COLORS, ROLE_LABELS, type AdminRole } from "@/constants/permissions";
import { addStaff, updateStaffRole, toggleStaffActive } from "./actions";

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
};

export default async function StaffPage() {
  await requireAccess("/staff");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_staff")
    .select("id, email, name, role, is_active, created_at")
    .order("created_at", { ascending: true });

  const staff = (data ?? []) as StaffRow[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Staff Management"
        description="Invite team members and control console access"
      />

      {/* Add staff form */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Add New Staff Member</h2>
        </div>
        <form action={addStaff as (formData: FormData) => void} className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Ali Hassan"
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="staff@example.com"
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="role" className="text-xs font-medium text-muted-foreground">Role</label>
            <select
              id="role"
              name="role"
              defaultValue="support"
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ALL_ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add Staff
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-400">Failed to load staff: {error.message}</p>
        )}
      </div>

      {/* Staff table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Added</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{member.name}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{member.email}</td>
                <td className="px-4 py-3">
                  <form action={updateStaffRole as (formData: FormData) => void} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="rounded-md border border-border bg-input px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {ALL_ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[member.role]}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${member.is_active ? "bg-green-400" : "bg-red-400"}`} />
                    <span className={`text-xs ${member.is_active ? "text-green-400" : "text-red-400"}`}>
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <form action={toggleStaffActive as (formData: FormData) => void}>
                    <input type="hidden" name="id" value={member.id} />
                    <input type="hidden" name="is_active" value={String(member.is_active)} />
                    <button
                      type="submit"
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        member.is_active
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {member.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No staff members yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Role reference */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Role Permissions Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-2 text-left font-medium">Role</th>
                {["Dashboard", "Tenants", "Users", "Billing", "Reports", "Blog", "Announcements", "Audit", "Settings", "Staff"].map((col) => (
                  <th key={col} className="pb-2 text-center font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(
                [
                  { role: "super_admin" as AdminRole, access: [true, true, true, true, true, true, true, true, true, true] },
                  { role: "accounts" as AdminRole, access: [true, false, false, true, false, false, false, false, false, false] },
                  { role: "support" as AdminRole, access: [true, true, true, false, false, false, false, false, false, false] },
                  { role: "reports_viewer" as AdminRole, access: [true, false, false, false, true, false, false, false, false, false] },
                ]
              ).map(({ role, access }) => (
                <tr key={role}>
                  <td className="py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                  </td>
                  {access.map((allowed, i) => (
                    <td key={i} className="py-2 text-center">
                      {allowed ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
