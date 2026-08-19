import { DIAGNOSTIC } from "./config";
import type { DiagnosticResult, Profile } from "./types";

/*
  Server-side plumbing: transactional email and Stripe. Both degrade quietly —
  with no Resend key and no Stripe key the diagnostic still runs end to end, it
  just stops emailing and can't take payment.

  Leads arrive by email rather than being stored: every completed diagnostic
  sends Jemina a summary, and every purchase sends a second one. If this ever
  needs a database, `storeSubmission` is the one function to add back.
*/

export const SERVER_CONFIG = {
  resendKey: process.env.RESEND_API_KEY ?? "",
  fromEmail: process.env.DIAGNOSTIC_FROM_EMAIL ?? "Tulivo Digital <onboarding@resend.dev>",
  notifyEmail: process.env.DIAGNOSTIC_NOTIFY_EMAIL ?? "jemina@tulivodigital.com",
  stripeKey: process.env.STRIPE_SECRET_KEY ?? "",
  pricePence: Number(process.env.DIAGNOSTIC_PRICE_PENCE ?? 29700),
  unlockCode: process.env.DIAGNOSTIC_UNLOCK_CODE ?? "",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EmailAttachment {
  filename: string;
  /** Base64 payload, no data: prefix. */
  content: string;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<boolean> {
  if (!SERVER_CONFIG.resendKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVER_CONFIG.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SERVER_CONFIG.fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
        attachments: options.attachments,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------- emails */

const SHELL = (body: string) => `
<div style="font-family:-apple-system,Segoe UI,Inter,Helvetica,Arial,sans-serif;background:#faf7f3;padding:32px 0;">
  <div style="max-width:560px;margin:0 auto;background:#fffdfb;border:1px solid #e8e0d5;border-radius:18px;padding:32px;">
    <div style="font-size:11px;letter-spacing:3px;color:#6a6058;font-weight:600;text-transform:uppercase;">Tulivo Digital</div>
    ${body}
    <div style="margin-top:28px;border-top:1px solid #f0eae2;padding-top:16px;font-size:12px;color:#9a8f86;">
      ${escapeHtml(DIAGNOSTIC.consultant)} · ${escapeHtml(DIAGNOSTIC.company)} · ${escapeHtml(DIAGNOSTIC.contactEmail)}
    </div>
  </div>
</div>`;

export function clientReportEmail(profile: Profile, result: DiagnosticResult): string {
  const priorities = result.priorities
    .map(
      (p, i) =>
        `<li style="margin-bottom:6px;color:#201b18;"><strong>${i + 1}. ${escapeHtml(p.title)}</strong> — ${p.score}/100 · ${
          p.status === "red" ? "Critical" : p.status === "amber" ? "Needs work" : "Strong"
        }</li>`,
    )
    .join("");

  return SHELL(`
    <h1 style="margin:20px 0 8px;font-size:24px;line-height:1.25;color:#201b18;">Your full diagnostic report is ready</h1>
    <p style="font-size:15px;line-height:1.6;color:#6a6058;">Hey ${escapeHtml(profile.name)},</p>
    <p style="font-size:15px;line-height:1.6;color:#6a6058;">Your report is attached to this email — ${DIAGNOSTIC.reportPages} pages, written from your answers.</p>
    <div style="margin:22px 0;padding:18px;background:#f4efe8;border-radius:14px;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6a6058;font-weight:600;">Your overall score</div>
      <div style="font-size:38px;font-weight:700;color:#201b18;line-height:1.1;margin-top:6px;">${result.overall}<span style="font-size:18px;color:#9a8f86;">/100</span></div>
      <div style="font-size:14px;color:#be6044;font-weight:600;margin-top:4px;">${escapeHtml(result.bandLabel)}</div>
    </div>
    <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#6a6058;font-weight:600;">Your top three priorities</div>
    <ol style="padding-left:18px;font-size:15px;line-height:1.6;margin-top:10px;">${priorities}</ol>
    <p style="font-size:15px;line-height:1.6;color:#6a6058;margin-top:20px;">Inside your report:</p>
    <ul style="padding-left:18px;font-size:15px;line-height:1.6;color:#6a6058;">
      <li>What's broken in each of the eight stages</li>
      <li>Specific recommendations to fix it</li>
      <li>Your 30/60/90 day action plan</li>
      <li>Quick wins for this week</li>
    </ul>
    <p style="margin-top:24px;">
      <a href="${DIAGNOSTIC.bookingUrl}" style="display:inline-block;background:#be6044;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-size:15px;font-weight:600;">Book a 15-minute call</a>
    </p>
    <p style="font-size:14px;line-height:1.6;color:#6a6058;">Questions about your results? Just reply to this email.</p>
    <p style="font-size:15px;color:#201b18;margin-top:18px;">${escapeHtml(DIAGNOSTIC.consultant)}<br/><span style="color:#9a8f86;">${escapeHtml(DIAGNOSTIC.company)}</span></p>
  `);
}

export function notificationEmail(
  profile: Profile,
  result: DiagnosticResult,
  kind: "completed" | "purchased",
): string {
  const rows = result.sections
    .map(
      (s) =>
        `<tr><td style="padding:4px 0;font-size:14px;color:#6a6058;">${escapeHtml(s.title)}</td><td style="padding:4px 0;text-align:right;font-size:14px;font-weight:600;color:${
          s.status === "green" ? "#3e7a60" : s.status === "amber" ? "#bf8d33" : "#b24233"
        };">${s.score}</td></tr>`,
    )
    .join("");

  return SHELL(`
    <h1 style="margin:20px 0 8px;font-size:22px;color:#201b18;">${
      kind === "purchased" ? "Diagnostic purchased" : "New diagnostic completed"
    }</h1>
    <p style="font-size:15px;line-height:1.6;color:#6a6058;">
      <strong style="color:#201b18;">${escapeHtml(profile.name)}</strong><br/>
      ${escapeHtml(profile.business)} · ${escapeHtml(profile.businessType)}<br/>
      <a href="mailto:${escapeHtml(profile.email)}" style="color:#be6044;">${escapeHtml(profile.email)}</a>
    </p>
    <div style="margin:18px 0;padding:16px;background:#f4efe8;border-radius:12px;">
      <div style="font-size:30px;font-weight:700;color:#201b18;">${result.overall}<span style="font-size:16px;color:#9a8f86;">/100</span></div>
      <div style="font-size:14px;color:#be6044;font-weight:600;">${escapeHtml(result.bandLabel)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <div style="margin-top:18px;font-size:14px;color:#6a6058;">
      <strong style="color:#201b18;">Priorities:</strong> ${result.priorities.map((p) => `${escapeHtml(p.title)} (${p.score})`).join(" · ")}
    </div>
  `);
}
