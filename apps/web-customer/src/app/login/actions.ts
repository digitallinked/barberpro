"use server";

import { createClient } from "@/lib/supabase/server";

type LoginResult =
  | { success: true }
  | { success: false; error: string; emailNotConfirmed?: boolean };

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
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
