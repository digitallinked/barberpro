import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getQueueTicketsForBranch } from "@/services/queue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch");

  if (!branchId) {
    return NextResponse.json({ error: "Missing branch id" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const result = await getQueueTicketsForBranch(supabase, branchId);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.data ?? [], branchName: result.branchName ?? "Branch", seats: result.seats ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load queue board";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
