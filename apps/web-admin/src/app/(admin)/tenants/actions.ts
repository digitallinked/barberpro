"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit-log";
import { getStripe, hasStripeEnv, STRIPE_PLANS, type StripePlan } from "@/lib/stripe";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function revalidateTenant(id: string) {
  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
}

// ─── Account suspend / unsuspend ─────────────────────────────────────────────

export async function suspendTenant(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Invalid input." };

  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("tenants")
    .update({ status: "suspended" })
    .eq("id", id) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({ action: "tenant.suspend", targetType: "tenant", targetId: id });
  revalidateTenant(id);
  return { success: true };
}

export async function unsuspendTenant(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Invalid input." };

  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("tenants")
    .update({ status: "active" })
    .eq("id", id) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({ action: "tenant.unsuspend", targetType: "tenant", targetId: id });
  revalidateTenant(id);
  return { success: true };
}

// ─── Cancel subscription ──────────────────────────────────────────────────────

const cancelSchema = z.object({
  tenantId: z.string().uuid(),
  immediately: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function cancelTenantSubscription(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };
  if (!hasStripeEnv()) return { error: "Stripe is not configured." };

  const parsed = cancelSchema.safeParse({
    tenantId: formData.get("tenantId"),
    immediately: formData.get("immediately") ?? "false",
  });
  if (!parsed.success) return { error: "Invalid input." };

  const { tenantId, immediately } = parsed.data;
  const supabase = createAdminClient();

  const { data: tenant } = await (supabase as any)
    .from("tenants")
    .select("stripe_subscription_id")
    .eq("id", tenantId)
    .maybeSingle() as { data: { stripe_subscription_id: string | null } | null };

  if (!tenant?.stripe_subscription_id) {
    return { error: "No active Stripe subscription found for this tenant." };
  }

  const stripe = getStripe();

  if (immediately) {
    await stripe.subscriptions.cancel(tenant.stripe_subscription_id);
    await (supabase as any)
      .from("tenants")
      .update({ subscription_status: "canceled" })
      .eq("id", tenantId);
  } else {
    await stripe.subscriptions.update(tenant.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    // Keep status as active until period end — Stripe webhook will update it
  }

  await logAdminAction({
    action: immediately ? "subscription.cancel_immediately" : "subscription.cancel_at_period_end",
    targetType: "tenant",
    targetId: tenantId,
    metadata: { stripe_subscription_id: tenant.stripe_subscription_id },
  });
  revalidateTenant(tenantId);
  return { success: true };
}

// ─── Grant free access (override without Stripe) ─────────────────────────────

const grantAccessSchema = z.object({
  tenantId: z.string().uuid(),
  plan: z.enum(["starter", "professional"]),
  days: z.string().transform(Number).pipe(z.number().int().min(1).max(3650)),
});

export async function grantFreeAccess(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const parsed = grantAccessSchema.safeParse({
    tenantId: formData.get("tenantId"),
    plan: formData.get("plan"),
    days: formData.get("days") ?? "30",
  });
  if (!parsed.success) return { error: "Invalid input: " + parsed.error.issues[0]?.message };

  const { tenantId, plan, days } = parsed.data;
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("tenants")
    .update({
      subscription_status: "active",
      plan,
      trial_ends_at: expiresAt,
      onboarding_completed: true,
    })
    .eq("id", tenantId) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({
    action: "subscription.grant_free_access",
    targetType: "tenant",
    targetId: tenantId,
    metadata: { plan, days, expires_at: expiresAt },
  });
  revalidateTenant(tenantId);
  return { success: true };
}

// ─── Revoke free access ───────────────────────────────────────────────────────

export async function revokeFreeAccess(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };

  const tenantId = z.string().uuid().safeParse(formData.get("tenantId"));
  if (!tenantId.success) return { error: "Invalid tenant ID." };

  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("tenants")
    .update({ subscription_status: "canceled", trial_ends_at: null })
    .eq("id", tenantId.data) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({
    action: "subscription.revoke_free_access",
    targetType: "tenant",
    targetId: tenantId.data,
  });
  revalidateTenant(tenantId.data);
  return { success: true };
}

// ─── Extend trial ─────────────────────────────────────────────────────────────

const extendTrialSchema = z.object({
  tenantId: z.string().uuid(),
  days: z.string().transform(Number).pipe(z.number().int().min(1).max(365)),
});

export async function extendTenantTrial(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };
  if (!hasStripeEnv()) return { error: "Stripe is not configured." };

  const parsed = extendTrialSchema.safeParse({
    tenantId: formData.get("tenantId"),
    days: formData.get("days") ?? "14",
  });
  if (!parsed.success) return { error: "Invalid input." };

  const { tenantId, days } = parsed.data;
  const supabase = createAdminClient();

  const { data: tenant } = await (supabase as any)
    .from("tenants")
    .select("stripe_subscription_id, trial_ends_at")
    .eq("id", tenantId)
    .maybeSingle() as { data: { stripe_subscription_id: string | null; trial_ends_at: string | null } | null };

  if (!tenant?.stripe_subscription_id) {
    return { error: "No Stripe subscription found for this tenant." };
  }

  // Extend from now or from current trial end, whichever is later
  const currentEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at).getTime() : Date.now();
  const newTrialEnd = Math.max(currentEnd, Date.now()) + days * 86_400_000;
  const newTrialEndTs = Math.floor(newTrialEnd / 1000);

  const stripe = getStripe();
  await stripe.subscriptions.update(tenant.stripe_subscription_id, {
    trial_end: newTrialEndTs,
  });

  await (supabase as any)
    .from("tenants")
    .update({
      trial_ends_at: new Date(newTrialEnd).toISOString(),
      subscription_status: "trialing",
    })
    .eq("id", tenantId);

  await logAdminAction({
    action: "subscription.extend_trial",
    targetType: "tenant",
    targetId: tenantId,
    metadata: { days, new_trial_end: new Date(newTrialEnd).toISOString() },
  });
  revalidateTenant(tenantId);
  return { success: true };
}

// ─── Change plan ──────────────────────────────────────────────────────────────

const changePlanSchema = z.object({
  tenantId: z.string().uuid(),
  plan: z.enum(["starter", "professional"]),
});

export async function changeTenantPlan(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };
  if (!hasStripeEnv()) return { error: "Stripe is not configured." };

  const parsed = changePlanSchema.safeParse({
    tenantId: formData.get("tenantId"),
    plan: formData.get("plan"),
  });
  if (!parsed.success) return { error: "Invalid input." };

  const { tenantId, plan } = parsed.data;
  const newPriceId = STRIPE_PLANS[plan as StripePlan].priceId;
  const supabase = createAdminClient();

  const { data: tenant } = await (supabase as any)
    .from("tenants")
    .select("stripe_subscription_id")
    .eq("id", tenantId)
    .maybeSingle() as { data: { stripe_subscription_id: string | null } | null };

  if (!tenant?.stripe_subscription_id) {
    // No Stripe sub — just update DB plan directly (e.g. free access tenants)
    const { error } = await (supabase as any)
      .from("tenants")
      .update({ plan })
      .eq("id", tenantId) as { error: { message: string } | null };
    if (error) return { error: error.message };
    await logAdminAction({
      action: "subscription.change_plan_db_only",
      targetType: "tenant",
      targetId: tenantId,
      metadata: { plan },
    });
    revalidateTenant(tenantId);
    return { success: true };
  }

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) return { error: "Could not find subscription item." };

  await stripe.subscriptions.update(tenant.stripe_subscription_id, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: "create_prorations",
    metadata: { plan },
  });

  await (supabase as any)
    .from("tenants")
    .update({ plan, stripe_price_id: newPriceId })
    .eq("id", tenantId);

  await logAdminAction({
    action: "subscription.change_plan",
    targetType: "tenant",
    targetId: tenantId,
    metadata: { plan, price_id: newPriceId },
  });
  revalidateTenant(tenantId);
  return { success: true };
}

// ─── Sync from Stripe ─────────────────────────────────────────────────────────

export async function syncTenantFromStripe(formData: FormData) {
  const role = await requireAccess("/tenants");
  if (role !== "super_admin") return { error: "Insufficient permissions." };
  if (!hasStripeEnv()) return { error: "Stripe is not configured." };

  const tenantId = z.string().uuid().safeParse(formData.get("tenantId"));
  if (!tenantId.success) return { error: "Invalid tenant ID." };

  const supabase = createAdminClient();
  const { data: tenant } = await (supabase as any)
    .from("tenants")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("id", tenantId.data)
    .maybeSingle() as {
    data: { stripe_subscription_id: string | null; stripe_customer_id: string | null } | null;
  };

  if (!tenant?.stripe_subscription_id) {
    return { error: "No Stripe subscription ID on record. Nothing to sync." };
  }

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);

  const planMeta = sub.metadata?.plan;
  const priceId = sub.items.data[0]?.price?.id ?? null;
  let plan = planMeta;
  if (!plan) {
    if (priceId === STRIPE_PLANS.professional.priceId) plan = "professional";
    else if (priceId === STRIPE_PLANS.starter.priceId) plan = "starter";
  }

  const patch: Record<string, unknown> = {
    subscription_status: sub.status,
    stripe_price_id: priceId,
    trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
  };
  if (plan) patch.plan = plan;

  await (supabase as any).from("tenants").update(patch).eq("id", tenantId.data);

  await logAdminAction({
    action: "subscription.sync_from_stripe",
    targetType: "tenant",
    targetId: tenantId.data,
    metadata: { stripe_status: sub.status, plan },
  });
  revalidateTenant(tenantId.data);
  return { success: true, status: sub.status };
}
