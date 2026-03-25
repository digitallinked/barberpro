import { Suspense } from "react";

import { PosPageClient } from "./pos-page-client";

export default function PosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      }
    >
      <PosPageClient />
    </Suspense>
  );
}
