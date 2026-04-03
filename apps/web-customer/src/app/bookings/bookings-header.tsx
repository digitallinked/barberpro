"use client";

import Link from "next/link";
import { CalendarClock, Search } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

type Props = {
  upcomingCount: number;
};

export function BookingsHeader({ upcomingCount }: Props) {
  const t = useT();

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CalendarClock className="h-6 w-6 text-primary" />
            {t.bookings.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.bookings.desc}</p>
        </div>
        <Link
          href="/shops"
          className="flex items-center gap-1.5 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          {t.bookings.findShops}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">{t.bookings.upcoming}</p>
        <p className="mt-1 text-2xl font-bold text-primary">{upcomingCount}</p>
        <p className="text-xs text-muted-foreground">
          {upcomingCount !== 1 ? t.bookings.appointmentPlural : t.bookings.appointmentSingular}
        </p>
      </div>
    </>
  );
}
