import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "./booking-form";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BookPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/shop/${slug}/book`);

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!tenant) notFound();

  const [servicesResult, staffResult, branchesResult] = await Promise.all([
    admin
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name"),
    admin
      .from("staff_profiles")
      .select("id, nickname")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true),
    admin
      .from("branches")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("is_hq", { ascending: false }),
  ]);

  const services = servicesResult.data ?? [];
  const staff = staffResult.data ?? [];
  const branches = branchesResult.data ?? [];

  if (services.length === 0 || branches.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking Unavailable</h1>
          <p className="mt-2 text-muted-foreground">This shop hasn&apos;t set up services yet.</p>
          <Link href={`/shop/${slug}`} className="mt-4 inline-block text-sm text-accent hover:underline">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">BarberPro</Link>
          <Link href={`/shop/${slug}`} className="text-sm text-muted-foreground hover:text-foreground">
            Back to {tenant.name}
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold">Book at {tenant.name}</h1>
          <p className="mt-2 text-muted-foreground">Select your service and preferred time.</p>

          <BookingForm
            tenantId={tenant.id}
            slug={slug}
            services={services}
            staff={staff}
            branches={branches}
          />
        </div>
      </main>
    </div>
  );
}
