import { NextResponse } from "next/server";

// Payment Intent creation for booking deposits.
//
// NOT YET PRODUCTION-READY. Re-enable once the following are implemented:
//   1. Fetch the appointment from the DB and verify it belongs to the current user.
//   2. Derive the deposit amount server-side from the appointment row — never accept
//      a client-supplied amount value.
//   3. Add Zod validation for the request body.
//   4. Remove the 501 guard below.

export async function POST() {
  return NextResponse.json(
    { error: "Booking deposit payments are not yet available." },
    { status: 501 }
  );
}
