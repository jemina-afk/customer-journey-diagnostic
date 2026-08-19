import { NextResponse } from "next/server";
import { SERVER_CONFIG } from "@/lib/diagnostic/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Confirms a Stripe Checkout session was actually paid before unlocking. */
export async function POST(request: Request) {
  let body: { checkoutSessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ paid: false }, { status: 400 });
  }

  const sessionId = body.checkoutSessionId;
  if (!sessionId || !SERVER_CONFIG.stripeKey) {
    return NextResponse.json({ paid: false });
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${SERVER_CONFIG.stripeKey}` },
    });
    const data = (await res.json()) as { payment_status?: string };
    return NextResponse.json({ paid: res.ok && data.payment_status === "paid" });
  } catch {
    return NextResponse.json({ paid: false });
  }
}
