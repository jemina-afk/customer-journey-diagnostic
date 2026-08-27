import { NextResponse } from "next/server";
import { readAccessToken } from "@/lib/diagnostic/accessLink";
import {
  AUTH,
  SESSION_COOKIE,
  authConfigured,
  createSessionValue,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { getStore } from "@/lib/store";

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

  const response = NextResponse.json({ ok: true, profile: payload.profile, tier: payload.tier });

  /*
    A link Jemina sent after a call is proof enough of who they are, so it also
    signs them in - no inbox round-trip for someone who has already paid. Their
    usage still counts against the same account limit as everyone else's.
  */
  const store = getStore();
  const email = payload.profile.email?.trim().toLowerCase();
  if (AUTH.required && authConfigured() && store && email) {
    const account = (await store.accountByEmail(email)) ?? (await store.createAccount(email));
    response.cookies.set(SESSION_COOKIE, createSessionValue(account.id), sessionCookieOptions());
  }

  return response;
}
