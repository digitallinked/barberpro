"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const schema = z.object({
  email: z.string().email("Please enter a valid email address").trim(),
});

type Result = { success: true } | { success: false; error: string };

export async function forgotPasswordAction(input: { email: string }): Promise<Result> {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    });

    if (error) return { success: false, error: error.message };

    // Always return success to avoid email enumeration
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
