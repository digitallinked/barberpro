"use server";

import { createClient } from "@/lib/supabase/server";

type SignupResult = { success: true } | { success: false; error: string };

export async function signupAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SignupResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.name },
      },
    });

    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "Signup failed" };

    // Create customer_accounts row
    await supabase.from("customer_accounts").insert({
      auth_user_id: data.user.id,
      full_name: input.name,
      email: input.email,
    });

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
