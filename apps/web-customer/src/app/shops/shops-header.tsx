"use client";

import { useT } from "@/lib/i18n/language-context";

export function ShopsHeader({ count }: { count: number }) {
  const t = useT();

  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{t.shops.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {count}{" "}
        {count !== 1 ? t.shops.verifiedShopsPlural : t.shops.verifiedShopSingular}
      </p>
    </div>
  );
}
