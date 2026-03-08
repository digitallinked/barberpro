import { PagePlaceholder } from "@/components/page-placeholder";

type StaffDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { id } = await params;
  return (
    <PagePlaceholder
      title={`Staff Detail: ${id}`}
      description="Individual barber performance, commission setup, and profile controls."
    />
  );
}
