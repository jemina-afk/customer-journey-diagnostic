import { NextResponse } from "next/server";
import { readAccessToken } from "@/lib/diagnostic/accessLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verifies a client access link and hands back who it belongs to. */
export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload = readAccessToken(body.token ?? "");
  if (!payload) return NextResponse.json({ ok: false });

  return NextResponse.json({ ok: true, profile: payload.profile, tier: payload.tier });
}
