import { NextResponse } from "next/server";
import { scoreDiagnostic } from "@/lib/diagnostic/scoring";
import {
  SERVER_CONFIG,
  clientReportEmail,
  notificationEmail,
  sendEmail,
} from "@/lib/diagnostic/server";
import { fileName } from "@/lib/diagnostic/pdf";
import type { Answers, Profile } from "@/lib/diagnostic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  Emails the unlocked report. The PDF is generated in the browser (where the
  fonts and layout already live) and posted here as a data URI, so there's one
  renderer producing both the download and the attachment.
*/
export async function POST(request: Request) {
  let body: { id?: string; profile?: Profile; answers?: Answers; pdf?: string; test?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, pdf } = body;
  if (!profile?.email) {
    return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
  }

  const result = scoreDiagnostic(body.answers ?? {});

  const base64 = typeof pdf === "string" ? pdf.split("base64,").pop() ?? "" : "";
  const attachments = base64 ? [{ filename: fileName(profile), content: base64 }] : undefined;

  const sent = await sendEmail({
    to: profile.email,
    subject: `${body.test ? "[TEST] " : ""}Your Customer Journey Diagnostic Report`,
    html: clientReportEmail(profile, result),
    replyTo: SERVER_CONFIG.notifyEmail,
    attachments,
  });

  await sendEmail({
    to: SERVER_CONFIG.notifyEmail,
    subject: `${body.test ? "[TEST] " : ""}Diagnostic purchased: ${profile.business} - ${result.overall}/100`,
    html: notificationEmail(profile, result, "purchased"),
    replyTo: profile.email,
  });

  return NextResponse.json({ ok: true, sent });
}
