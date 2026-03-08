"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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
  address: string;
  plan: "starter" | "professional";
}) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

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
        address: data.address,
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
      address: data.address,
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

  await supabase.from("app_users").insert({
    tenant_id: tenant.id,
    auth_user_id: user.id,
    full_name: fullName,
    email: user.email,
    role: "owner",
    is_active: true
  });

  return { success: true, tenantId: tenant.id };
}
