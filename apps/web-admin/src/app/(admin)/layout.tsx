import { headers } from "next/headers";
import { type ReactNode } from "react";

import { type AdminRole } from "@/constants/permissions";
import { AdminShell } from "@/components/admin-shell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const headersList = await headers();
  const role = (headersList.get("x-admin-role") ?? "support") as AdminRole;

  return <AdminShell role={role}>{children}</AdminShell>;
}
