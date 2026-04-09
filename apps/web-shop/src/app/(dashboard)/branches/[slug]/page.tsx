"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BranchSlugRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    router.replace(`/branches/${slug}/overview`);
  }, [slug, router]);

  return null;
}
