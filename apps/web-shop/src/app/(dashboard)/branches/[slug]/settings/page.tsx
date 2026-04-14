import { redirect } from "next/navigation";

export default async function BranchSettingsRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/branches/${slug}`);
}
