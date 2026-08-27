import { NextResponse } from "next/server";
import { AUTH, authConfigured, currentAccount, quotaFor } from "@/lib/auth/session";
import { getStore, storeIsPersistent } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Who's signed in, and how many diagnostics they have left. */
export async function GET() {
  if (!AUTH.required) {
    return NextResponse.json({ required: false, signedIn: true });
  }

  // Fail closed: if the gate is switched on but can't work, nobody gets in.
  if (!authConfigured() || !getStore()) {
    return NextResponse.json({
      required: true,
      signedIn: false,
      broken: true,
      message: "Sign-in is switched on but not configured. Set AUTH_SECRET and DATABASE_URL.",
    });
  }

  const account = await currentAccount();
  if (!account) return NextResponse.json({ required: true, signedIn: false });

  const quota = await quotaFor(account.id);
  return NextResponse.json({
    required: true,
    signedIn: true,
    email: account.email,
    quota,
    persistent: storeIsPersistent(),
    windowDays: AUTH.windowDays,
  });
}
