import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { shopMediaDisplayUrl } from "@barberpro/db/shop-media";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { CheckInForm } from "@/app/check-in/[token]/check-in-form";
import type { CheckInService, LoggedInUser } from "@/app/check-in/[token]/page";

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
  title: "Join Queue — BarberPro",
  robots: { index: false, follow: true },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default async function BranchCheckInPage({
  params,
}: {
  params: Promise<{ branchSlug: string; token: string }>;
}) {
  const { branchSlug, token } = await params;
  if (!TOKEN_RE.test(token)) notFound();

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("branches")
      .select(
        "id, name, slug, tenant_id, accepts_walkin_queue, accepts_online_bookings, tenants(name, logo_url, tenant_images(storage_path, sort_order))"
      )
      .eq("checkin_token", token)
      .maybeSingle();
    if (!data?.name) notFound();

    // Ensure the branch slug in the URL matches the actual branch
    if (data.slug !== branchSlug) notFound();

    const tenantRaw = data.tenants as {
      name?: string;
      logo_url?: string | null;
      tenant_images?: { storage_path: string; sort_order: number }[];
    } | null;
    const tenantLogoUrl = tenantRaw?.logo_url ?? null;
    const shopImageUrls = (tenantRaw?.tenant_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => shopMediaDisplayUrl(img.storage_path, { width: 960, quality: 85 }));

    if (!data.accepts_walkin_queue) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mb-4 inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-500/10">
              {tenantLogoUrl ? (
                <img
                  src={shopMediaDisplayUrl(tenantLogoUrl, { width: 256, quality: 90 })}
                  alt="Shop logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl">📅</span>
              )}
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

    let loggedInUser: LoggedInUser | null = null;
    try {
      const userClient = await createClient();
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (user) {
        const metaName = (user.user_metadata?.full_name as string | undefined) ?? "";
        const metaPhone = (user.user_metadata?.phone as string | undefined) ?? null;
        const { data: customerRecord } = await admin
          .from("customers")
          .select("full_name, phone")
          .eq("tenant_id", data.tenant_id)
          .or(`phone.eq.${user.email ?? ""},phone.eq.${metaPhone ?? ""}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const name = customerRecord?.full_name || metaName || user.email?.split("@")[0] || "";
        const rawPhone = customerRecord?.phone ?? metaPhone;
        const phone = rawPhone && !rawPhone.includes("@") ? rawPhone : null;
        loggedInUser = { name, email: user.email ?? "", phone };
      }
    } catch {
      // Non-critical — continue as guest if user lookup fails
    }

    return (
      <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
        {shopImageUrls.length > 0 && (
          <div className="mx-auto mb-6 max-w-sm overflow-hidden rounded-2xl">
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              <img
                src={shopImageUrls[0]}
                alt={`${data.name} photo`}
                className="h-full w-full object-cover"
              />
              {shopImageUrls.length > 1 && (
                <span className="absolute right-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                  1 / {shopImageUrls.length}
                </span>
              )}
            </div>
          </div>
        )}

        {tenantLogoUrl && shopImageUrls.length === 0 && (
          <div className="mx-auto mb-6 flex max-w-sm justify-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src={shopMediaDisplayUrl(tenantLogoUrl, { width: 256, quality: 90 })}
                alt={`${data.name} logo`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <CheckInForm
          branchName={data.name}
          branchId={data.id}
          token={token}
          services={services}
          loggedInUser={loggedInUser}
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
