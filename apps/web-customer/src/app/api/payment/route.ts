import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Payment Intent creation for booking deposits.
// TODO: Before enabling in production:
//   1. Fetch the appointment from the DB and verify it belongs to the current user.
//   2. Use the server-side deposit_amount from the appointment row — never accept
//      a client-supplied amount.
//   3. Remove the 501 guard below and replace with the full implementation.

const bodySchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
  paymentMethod: z.enum(["card", "grabpay", "fpx"]).optional().default("card"),
});

export async function POST(request: Request) {
  // This endpoint is not yet production-ready. Remove this guard once
  // server-side appointment-ownership and amount verification are implemented.
  return NextResponse.json(
    { error: "Booking deposit payments are not yet available." },
    { status: 501 }
  );

  // ── Implementation stub (kept for reference) ──────────────────────────────
  try {
    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = bodySchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error?.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { appointmentId, paymentMethod } = body.data;

    // TODO: Fetch appointment, verify ownership, and derive amount server-side.
    // const { data: appointment } = await supabase
    //   .from("appointments")
    //   .select("id, deposit_amount, customer_id")
    //   .eq("id", appointmentId)
    //   .eq("customer_id", user.id)
    //   .maybeSingle();
    // if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // const amount = appointment.deposit_amount;

    const stripe = new Stripe(stripeKey);
    const paymentMethodTypes: string[] = ["card"];
    if (paymentMethod === "grabpay") paymentMethodTypes.push("grabpay");
    if (paymentMethod === "fpx") paymentMethodTypes.push("fpx");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 0, // replace with server-derived amount
      currency: "myr",
      payment_method_types: paymentMethodTypes,
      metadata: {
        appointment_id: appointmentId,
        customer_email: user.email ?? "",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
