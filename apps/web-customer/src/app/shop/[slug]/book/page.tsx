import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
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
      .select("id, name, price, duration_min")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name"),
    admin
      .from("staff_profiles")
      .select("id, user_id, app_users(full_name)")
      .eq("tenant_id", tenant.id),
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
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <Scissors className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h1 className="mt-4 text-2xl font-bold">Booking Unavailable</h1>
            <p className="mt-2 text-muted-foreground">
              This shop hasn&apos;t set up services yet.
            </p>
            <Link
              href={`/shop/${slug}`}
              className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to {tenant.name}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-lg">
          <Link
            href={`/shop/${slug}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {tenant.name}
          </Link>

          <h1 className="text-2xl font-bold">Book at {tenant.name}</h1>
          <p className="mt-1 text-muted-foreground">Select your service and preferred time.</p>

          <BookingForm
            tenantId={tenant.id}
            slug={slug}
            services={services}
            staff={staff.map(s => ({
              id: s.id,
              name: (s.app_users as { full_name: string } | null)?.full_name ?? "Barber",
            }))}
            branches={branches}
          />
        </div>
      </main>
    </div>
  );
}
