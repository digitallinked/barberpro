import { requireAccess } from "@/lib/require-access";
import { PagePlaceholder } from "@/components/page-placeholder";

export default async function AuditLogsPage() {
  await requireAccess("/audit-logs");

  return (
    <PagePlaceholder
      title="Audit Logs"
      description="Track sensitive actions, access events, and administrative changes."
    />
  );
}
