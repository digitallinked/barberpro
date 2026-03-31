"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookAppointmentState = { error: string } | null;

const formSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  branch: z.string().uuid("Invalid branch"),
  service: z.string().uuid("Invalid service"),
  barber: z
    .string()
    .optional()
    .transform((s) => (s && s.trim().length > 0 ? s.trim() : null)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
});

export async function bookAppointmentAction(
  _prev: BookAppointmentState,
  formData: FormData
): Promise<BookAppointmentState> {
  const parsed = formSchema.safeParse({
    slug: formData.get("slug"),
    branch: formData.get("branch"),
    service: formData.get("service"),
    barber: formData.get("barber") ?? "",
    date: formData.get("date"),
    time: formData.get("time"),
  });

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.slug?.[0] ??
      first.branch?.[0] ??
      first.service?.[0] ??
      first.date?.[0] ??
      first.time?.[0] ??
      "Invalid form data";
    return { error: msg };
  }

  const { slug, branch: branchId, service: serviceId, barber: staffId, date, time } =
    parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const admin = createAdminClient();

    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (!tenant) return { error: "Shop not found" };

    const { data: branch } = await admin
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!branch) return { error: "Invalid branch" };

    const { data: serviceRow } = await admin
      .from("services")
      .select("duration_min")
      .eq("id", serviceId)
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!serviceRow) return { error: "Invalid service" };

    if (staffId) {
      const { data: staffRow } = await admin
        .from("staff_profiles")
        .select("id")
        .eq("id", staffId)
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (!staffRow) return { error: "Invalid barber selection" };
    }

    let { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("phone", user.email ?? "")
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await admin
        .from("customers")
        .insert({
          tenant_id: tenant.id,
          full_name: user.user_metadata?.full_name ?? user.email ?? "Online Customer",
          phone: user.email ?? "",
        })
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        return { error: "Failed to create customer record" };
      }
      customer = newCustomer;
    }

    const startMs = Date.parse(`${date}T${time}:00`);
    if (Number.isNaN(startMs)) {
      return { error: "Invalid date or time" };
    }

    const startAt = new Date(startMs).toISOString();
    const endAt = new Date(
      startMs + Number(serviceRow.duration_min) * 60_000
    ).toISOString();

    const { error: bookingError } = await admin.from("appointments").insert({
      tenant_id: tenant.id,
      branch_id: branchId,
      service_id: serviceId,
      barber_staff_id: staffId,
      customer_id: customer.id,
      start_at: startAt,
      end_at: endAt,
      source: "online",
      status: "confirmed",
    });

    if (bookingError) {
      return {
        error:
          process.env.NODE_ENV === "development"
            ? bookingError.message
            : "Failed to create appointment",
      };
    }
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "An unexpected error occurred",
    };
  }

  redirect(`/shop/${slug}?booked=true`);
}
