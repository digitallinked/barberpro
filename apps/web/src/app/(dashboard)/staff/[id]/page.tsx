import { PagePlaceholder } from "@/components/page-placeholder";

type StaffDetailPageProps = {
  params: { id: string };
};

export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  return (
    <PagePlaceholder
      title={`Staff Detail: ${params.id}`}
      description="Individual barber performance, commission setup, and profile controls."
    />
  );
}
