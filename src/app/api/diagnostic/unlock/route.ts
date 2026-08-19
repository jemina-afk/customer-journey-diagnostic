import { NextResponse } from "next/server";
import { SERVER_CONFIG } from "@/lib/diagnostic/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  Manual unlock for people who paid outside Stripe (Stan Store, invoice, or a
  call). Jemina shares the code from DIAGNOSTIC_UNLOCK_CODE after payment.
*/
export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = SERVER_CONFIG.unlockCode.trim();
  const supplied = (body.code ?? "").trim();
  if (!expected || !supplied || supplied.toLowerCase() !== expected.toLowerCase()) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
