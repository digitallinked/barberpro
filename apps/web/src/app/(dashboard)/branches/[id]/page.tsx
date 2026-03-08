import { PagePlaceholder } from "@/components/page-placeholder";

type BranchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BranchDetailPage({ params }: BranchDetailPageProps) {
  const { id } = await params;
  return (
    <PagePlaceholder
      title={`Branch Detail: ${id}`}
      description="Branch-specific operations, staff, inventory, and performance view."
    />
  );
}
