"use server";

import { createClient } from "@/lib/supabase/server";

type Result = { success: true } | { success: false; error: string };

export async function verifyOtpAction(email: string, token: string): Promise<Result> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function resendOtpAction(email: string): Promise<Result> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
