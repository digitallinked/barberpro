import { requireAccess } from "@/lib/require-access";
import { PagePlaceholder } from "@/components/page-placeholder";

export default async function ReportsPage() {
  await requireAccess("/reports");

  return (
    <PagePlaceholder
      title="Platform Reports"
      description="Cross-tenant usage analytics, growth trends, and operational health."
    />
  );
}
