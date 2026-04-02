import { requireAccess } from "@/lib/require-access";
import { PagePlaceholder } from "@/components/page-placeholder";

export default async function SettingsPage() {
  await requireAccess("/settings");

  return (
    <PagePlaceholder
      title="Platform Settings"
      description="Manage global feature flags, access policies, and platform configuration."
    />
  );
}
