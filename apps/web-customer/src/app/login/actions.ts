"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(72),
});

type LoginResult =
  | { success: true }
  | { success: false; error: string; emailNotConfirmed?: boolean };

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      const emailNotConfirmed = error.message.toLowerCase().includes("email not confirmed");
      return { success: false, error: error.message, emailNotConfirmed };
    }
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
