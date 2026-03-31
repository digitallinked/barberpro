import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Payment Intent creation for booking deposits.
// This is a stub — extend with actual Stripe config, GrabPay, TnG via payment methods.

export async function POST(request: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { amount, currency = "myr", appointmentId, paymentMethod } = await request.json();

    if (!amount || !appointmentId) {
      return NextResponse.json({ error: "amount and appointmentId required" }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);

    const paymentMethodTypes: string[] = ["card"];
    if (paymentMethod === "grabpay") paymentMethodTypes.push("grabpay");
    if (paymentMethod === "fpx") paymentMethodTypes.push("fpx");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method_types: paymentMethodTypes,
      metadata: {
        appointment_id: appointmentId,
        customer_email: user.email ?? "",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
