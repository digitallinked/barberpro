import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
