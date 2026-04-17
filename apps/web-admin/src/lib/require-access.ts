import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { canAccess, type AdminRole } from "@/constants/permissions";

/**
 * Call at the top of any server component page that requires a specific route access.
 * Reads the role from the x-admin-role header (set by middleware) and redirects to
 * /dashboard if the role is not permitted for the given pathname.
 */
export async function requireAccess(pathname: string): Promise<AdminRole> {
  const headersList = await headers();
  const roleHeader = headersList.get("x-admin-role");

  // If the header is absent the middleware did not run (e.g. missing env vars).
  // Fail closed: send to login rather than granting any implicit role.
  if (!roleHeader) {
    redirect("/login");
  }

  const role = roleHeader as AdminRole;

  if (!canAccess(role, pathname)) {
    redirect("/dashboard");
  }

  return role;
}
