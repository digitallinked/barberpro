import { PagePlaceholder } from "@/components/page-placeholder";

type BranchDetailPageProps = {
  params: { id: string };
};

export default function BranchDetailPage({ params }: BranchDetailPageProps) {
  return (
    <PagePlaceholder
      title={`Branch Detail: ${params.id}`}
      description="Branch-specific operations, staff, inventory, and performance view."
    />
  );
}
