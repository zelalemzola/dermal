import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("STRIPE_SECRET_KEY is not set");
}
const stripe = secretKey ? new Stripe(secretKey) : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment is not configured" },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const amount = body?.amount;
    if (typeof amount !== "number" || amount < 50) {
      return NextResponse.json(
        { error: "Invalid amount (minimum 50 cents)" },
        { status: 400 }
      );
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json(
      { clientSecret: paymentIntent.client_secret },
      { status: 200 }
    );
  } catch (error) {
    console.error("create-payment-intent error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
