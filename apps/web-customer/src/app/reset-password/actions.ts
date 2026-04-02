"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Result = { success: true } | { success: false; error: string };

export async function resetPasswordAction(input: { password: string }): Promise<Result> {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
