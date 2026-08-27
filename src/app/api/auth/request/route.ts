import { NextResponse } from "next/server";
import {
  AUTH,
  authConfigured,
  loginTokenExpiry,
  loginTokenMinutes,
  newLoginToken,
} from "@/lib/auth/session";
import { getStore } from "@/lib/store";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import { escapeHtml, sendEmail } from "@/lib/diagnostic/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Emails a one-time sign-in link. */
export async function POST(request: Request) {
  if (!AUTH.required) return NextResponse.json({ ok: true, required: false });
  if (!authConfigured()) {
    return NextResponse.json({ error: "Sign-in isn't configured yet." }, { status: 500 });
  }

  const store = getStore();
  if (!store) {
    return NextResponse.json({ error: "Sign-in isn't available right now." }, { status: 503 });
  }

  let body: { email?: string; origin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const account = (await store.accountByEmail(email)) ?? (await store.createAccount(email));
  const token = newLoginToken();
  await store.saveLoginToken(token, account.id, loginTokenExpiry());

  const origin = (body.origin ?? "").replace(/\/$/, "");
  const link = `${origin}/api/auth/callback?token=${token}`;

  const sent = await sendEmail({
    to: email,
    subject: "Your link to the Customer Journey Diagnostic",
    html: `
      <div style="font-family:-apple-system,Segoe UI,Inter,Helvetica,Arial,sans-serif;background:#faf7f3;padding:32px 0;">
        <div style="max-width:520px;margin:0 auto;background:#fffdfb;border:1px solid #e8e0d5;border-radius:18px;padding:32px;">
          <div style="font-size:11px;letter-spacing:3px;color:#6a6058;font-weight:600;text-transform:uppercase;">Tulivo Digital</div>
          <h1 style="margin:20px 0 8px;font-size:22px;color:#201b18;">Here's your sign-in link</h1>
          <p style="font-size:15px;line-height:1.6;color:#6a6058;">It works once, and expires in ${loginTokenMinutes} minutes.</p>
          <p style="margin:24px 0;">
            <a href="${escapeHtml(link)}" style="display:inline-block;background:#be6044;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-size:15px;font-weight:600;">Open the diagnostic</a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#9a8f86;">If you didn't ask for this, you can ignore it - nothing happens until the link is opened.</p>
          <div style="margin-top:28px;border-top:1px solid #f0eae2;padding-top:16px;font-size:12px;color:#9a8f86;">
            ${escapeHtml(DIAGNOSTIC.consultant)} · ${escapeHtml(DIAGNOSTIC.company)}
          </div>
        </div>
      </div>`,
  });

  // Locally there's usually no email provider, so hand the link back instead of
  // leaving development stuck at "check your inbox".
  const devLink = process.env.NODE_ENV !== "production" && !sent ? link : undefined;
  return NextResponse.json({ ok: true, sent, devLink });
}
