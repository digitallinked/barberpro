"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

type SignupResult = { success: true } | { success: false; error: string };

export async function signupAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
      },
    });

    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "Signup failed" };

    // Create customer_accounts row
    await (supabase as any).from("customer_accounts").insert({
      auth_user_id: data.user.id,
      full_name: parsed.data.name,
      email: parsed.data.email,
    });

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
