"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function checkSlugAvailability(slug: string, currentUserId?: string) {
  if (!slug || slug.length < 3) {
    return { available: false, error: "Slug must be at least 3 characters" };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { available: false, error: "Only lowercase letters, numbers, and hyphens" };
  }
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return { available: false, error: "Cannot start or end with a hyphen" };
  }

  const supabase = await createClient();

  const query = supabase
    .from("tenants")
    .select("id, owner_auth_id")
    .eq("slug", slug)
    .maybeSingle();

  const { data } = await query;

  // Taken by someone else (not the current user's own tenant)
  if (data && data.owner_auth_id !== currentUserId) {
    return { available: false, error: "This URL is already taken" };
  }

  return { available: true };
}

export async function signUp(formData: {
  email: string;
  password: string;
  fullName: string;
  acceptedTerms: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        accepted_terms: formData.acceptedTerms,
        accepted_terms_at: new Date().toISOString()
      },
      emailRedirectTo: undefined
    }
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOtp(email: string, token: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email"
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPassword(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function saveOnboarding(data: {
  shopName: string;
  slug: string;
  phone: string;
  addressLine1: string;
  city: string;
  postcode: string;
  state: string;
  plan: "starter" | "professional";
}) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Build a combined address string for backward compat with the `address` column
  const addressFull = [data.addressLine1, data.city, data.postcode, data.state]
    .filter(Boolean)
    .join(", ");

  const { data: existing } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_auth_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("tenants")
      .update({
        name: data.shopName,
        slug: data.slug,
        phone: data.phone,
        address: addressFull,
        address_line1: data.addressLine1,
        city: data.city,
        postcode: data.postcode,
        state: data.state,
        plan: data.plan,
        updated_at: new Date().toISOString()
      })
      .eq("owner_auth_id", user.id);

    if (error) return { error: error.message };
    return { success: true, tenantId: existing.id };
  }

  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({
      name: data.shopName,
      slug: data.slug,
      phone: data.phone,
      address: addressFull,
      address_line1: data.addressLine1,
      city: data.city,
      postcode: data.postcode,
      state: data.state,
      plan: data.plan,
      email: user.email,
      owner_auth_id: user.id,
      status: "active",
      subscription_status: "trialing"
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const fullName = user.user_metadata?.full_name ?? user.email ?? "Owner";

  // Auto-generate a branch code from the shop name initials
  const branchCode = data.shopName
    .split(/\s+/)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4)
    .padEnd(2, "X") + "01";

  // Create default HQ branch using the shop's address
  const { data: defaultBranch, error: branchError } = await supabase
    .from("branches")
    .insert({
      tenant_id: tenant.id,
      name: data.shopName,
      code: branchCode,
      address: addressFull || null,
      phone: data.phone || null,
      is_hq: true,
      is_active: true,
    })
    .select("id")
    .single();

  if (branchError) return { error: branchError.message };

  // Create the owner app_user, assigned to the default branch
  await supabase.from("app_users").insert({
    tenant_id: tenant.id,
    auth_user_id: user.id,
    full_name: fullName,
    email: user.email,
    role: "owner",
    branch_id: defaultBranch.id,
    is_active: true
  });

  return { success: true, tenantId: tenant.id };
}
