"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTenant } from "@/components/tenant-provider";

export default function StaffDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const { branches } = useTenant();

  useEffect(() => {
    const defaultBranch = branches.find((b) => b.is_hq) ?? branches[0];
    if (defaultBranch && params.id) {
      router.replace(`/${defaultBranch.slug}/staff/${params.id}`);
    }
  }, [router, branches, params.id]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
  );
}
