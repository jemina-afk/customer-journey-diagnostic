import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionValue, sessionCookieOptions } from "@/lib/auth/session";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Opens the emailed link: consumes the token and starts a session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const store = getStore();

  const accountId = store && token ? await store.consumeLoginToken(token) : null;
  if (!accountId) {
    return NextResponse.redirect(new URL("/?signin=expired", url.origin));
  }

  // Set on the response rather than through cookies(), which is the reliable
  // way to attach a cookie to a redirect.
  const response = NextResponse.redirect(new URL("/", url.origin));
  response.cookies.set(SESSION_COOKIE, createSessionValue(accountId), sessionCookieOptions());
  return response;
}
