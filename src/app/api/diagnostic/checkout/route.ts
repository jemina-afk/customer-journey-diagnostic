import { NextResponse } from "next/server";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import { SERVER_CONFIG } from "@/lib/diagnostic/server";
import type { Profile } from "@/lib/diagnostic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  Creates a Stripe Checkout session with a direct fetch to the Stripe API — no
  SDK, so nothing extra ships and the route runs anywhere. When Stripe isn't
  configured the client falls back to the external checkout URL (Stan Store).
*/
/** Lets the results screen know whether real payment is switched on. */
export async function GET() {
  return NextResponse.json({ configured: SERVER_CONFIG.stripeKey.length > 0 });
}

export async function POST(request: Request) {
  if (!SERVER_CONFIG.stripeKey) {
    return NextResponse.json({ configured: false, error: "Stripe is not configured." }, { status: 200 });
  }

  let body: { id?: string; profile?: Profile; overall?: number; returnUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id, profile, returnUrl } = body;
  if (!id || !profile?.email || !returnUrl) {
    return NextResponse.json({ error: "Missing checkout details" }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", returnUrl);
  params.set("customer_email", profile.email);
  params.set("client_reference_id", id);
  params.set("metadata[submission_id]", id);
  params.set("metadata[business]", profile.business);
  params.set("metadata[overall]", String(body.overall ?? ""));
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "gbp");
  params.set("line_items[0][price_data][unit_amount]", String(SERVER_CONFIG.pricePence));
  params.set("line_items[0][price_data][product_data][name]", "Customer Journey Diagnostic — Full Report");
  params.set(
    "line_items[0][price_data][product_data][description]",
    `${DIAGNOSTIC.reportPages}-page diagnostic report with recommendations and a 30/60/90 day action plan.`,
  );

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVER_CONFIG.stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) {
      return NextResponse.json({ error: data.error?.message ?? "Checkout could not be created." }, { status: 200 });
    }
    return NextResponse.json({ url: data.url });
  } catch {
    return NextResponse.json({ error: "Checkout is unavailable right now." }, { status: 200 });
  }
}
