import { headers } from "next/headers";
import { type ReactNode } from "react";

import { type AdminRole } from "@/constants/permissions";
import { AdminShell } from "@/components/admin-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const headersList = await headers();
  const role = (headersList.get("x-admin-role") ?? "support") as AdminRole;

  let email: string | undefined;
  let name: string | undefined;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? undefined;

    if (email) {
      const admin = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (admin as any)
        .from("admin_staff")
        .select("name")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      name = (data as { name?: string } | null)?.name ?? undefined;
    }
  } catch {
    // non-fatal
  }

  return (
    <AdminShell role={role} email={email} name={name}>
      {children}
    </AdminShell>
  );
}
