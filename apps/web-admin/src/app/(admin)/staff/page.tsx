import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "@/constants/permissions";
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
      <div>
        <h1 className="text-2xl font-semibold">Staff Management</h1>
        <p className="text-sm text-muted-foreground">
          Invite team members and control which parts of the admin console they can access.
        </p>
      </div>

      {/* Add staff form */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Add New Staff Member</h2>
        <form action={addStaff} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-xs font-medium text-muted-foreground">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Ali Hassan"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="staff@example.com"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-xs font-medium text-muted-foreground">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="support"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {ALL_ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
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
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Added</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{member.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                <td className="px-4 py-3">
                  <form action={updateStaffRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {ALL_ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.is_active
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <form action={toggleStaffActive}>
                    <input type="hidden" name="id" value={member.id} />
                    <input type="hidden" name="is_active" value={String(member.is_active)} />
                    <button
                      type="submit"
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        member.is_active
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
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
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No staff members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Role reference */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Role Permissions Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-2 text-left font-medium">Role</th>
                <th className="pb-2 text-center font-medium">Dashboard</th>
                <th className="pb-2 text-center font-medium">Tenants</th>
                <th className="pb-2 text-center font-medium">Users</th>
                <th className="pb-2 text-center font-medium">Billing</th>
                <th className="pb-2 text-center font-medium">Reports</th>
                <th className="pb-2 text-center font-medium">Audit Logs</th>
                <th className="pb-2 text-center font-medium">Settings</th>
                <th className="pb-2 text-center font-medium">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(
                [
                  { role: "super_admin", access: [true, true, true, true, true, true, true, true] },
                  { role: "accounts", access: [true, false, false, true, false, false, false, false] },
                  { role: "support", access: [true, true, true, false, false, false, false, false] },
                  { role: "reports_viewer", access: [true, false, false, false, true, false, false, false] },
                ] as { role: AdminRole; access: boolean[] }[]
              ).map(({ role, access }) => (
                <tr key={role}>
                  <td className="py-2 font-medium">{ROLE_LABELS[role]}</td>
                  {access.map((allowed, i) => (
                    <td key={i} className="py-2 text-center">
                      {allowed ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
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
