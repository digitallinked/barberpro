import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

import { CheckInForm } from "./check-in-form";

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) notFound();

  try {
    const admin = createAdminClient();
    const { data } = await admin.from("branches").select("name").eq("checkin_token", token).maybeSingle();
    if (!data?.name) notFound();
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
        <CheckInForm branchName={data.name} token={token} />
      </div>
    );
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-gray-400">
        <p className="text-lg text-white">Check-in unavailable</p>
        <p className="mt-2 max-w-sm text-sm">This page could not load. Ask staff for an updated QR code.</p>
      </div>
    );
  }
}
