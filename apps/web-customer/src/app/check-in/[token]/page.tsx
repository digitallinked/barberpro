import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

import { CheckInForm } from "./check-in-form";

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
  title: "Join Queue — BarberPro",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export type CheckInService = { id: string; name: string; price: number };

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) notFound();

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("branches")
      .select("id, name, tenant_id, accepts_walkin_queue, accepts_online_bookings")
      .eq("checkin_token", token)
      .maybeSingle();
    if (!data?.name) notFound();

    // Branch has disabled walk-in queue
    if (!data.accepts_walkin_queue) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <span className="text-3xl">📅</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Appointments Only</p>
            <h1 className="text-2xl font-black text-white">{data.name}</h1>
            <p className="mt-3 text-sm text-gray-400">
              This branch is currently not accepting walk-in customers. Please book an appointment online instead.
            </p>
            {data.accepts_online_bookings && (
              <a
                href={`/shops`}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#111]"
              >
                Book an Appointment
              </a>
            )}
          </div>
        </div>
      );
    }

    const { data: servicesRaw } = await admin
      .from("services")
      .select("id, name, price, is_active")
      .eq("tenant_id", data.tenant_id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    const services: CheckInService[] = (servicesRaw ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price ?? 0),
    }));

    return (
      <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
        <CheckInForm
          branchName={data.name}
          branchId={data.id}
          token={token}
          services={services}
        />
      </div>
    );
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-gray-400">
        <p className="text-lg text-white">Check-in unavailable</p>
        <p className="mt-2 max-w-sm text-sm">This page could not load. Ask staff for an updated QR code.</p>
      </div>
    );
  }
}
