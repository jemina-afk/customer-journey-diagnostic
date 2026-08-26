import { NextResponse } from "next/server";
import { adminKeyMatches, createAccessToken, linksConfigured } from "@/lib/diagnostic/accessLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mints a client access link. Only reachable with the admin key. */
export async function POST(request: Request) {
  if (!linksConfigured()) {
    return NextResponse.json(
      { error: "Set DIAGNOSTIC_LINK_SECRET and DIAGNOSTIC_ADMIN_KEY to use client links." },
      { status: 200 },
    );
  }

  let body: {
    key?: string;
    name?: string;
    business?: string;
    email?: string;
    businessType?: string;
    tier?: string;
    days?: number;
    origin?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!adminKeyMatches(body.key ?? "")) {
    return NextResponse.json({ error: "That key wasn't recognised." }, { status: 401 });
  }

  const days = Math.min(Math.max(body.days ?? 60, 1), 365);
  const token = createAccessToken({
    profile: {
      name: body.name?.trim() || undefined,
      business: body.business?.trim() || undefined,
      email: body.email?.trim() || undefined,
      businessType: body.businessType?.trim() || undefined,
    },
    tier: body.tier === "call" ? "call" : "report",
    expires: Math.floor(Date.now() / 1000) + days * 86400,
  });

  const origin = (body.origin ?? "").replace(/\/$/, "");
  return NextResponse.json({ url: `${origin}/?c=${token}`, expiresInDays: days });
}
