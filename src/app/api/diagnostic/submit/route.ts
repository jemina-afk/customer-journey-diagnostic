import { NextResponse } from "next/server";
import { scoreDiagnostic } from "@/lib/diagnostic/scoring";
import { SERVER_CONFIG, notificationEmail, sendEmail } from "@/lib/diagnostic/server";
import { currentAccount } from "@/lib/auth/session";
import { getStore } from "@/lib/store";
import type { Answers, Profile } from "@/lib/diagnostic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lead capture: email Jemina the moment someone finishes a diagnostic. */
export async function POST(request: Request) {
  let body: {
    id?: string;
    runId?: string;
    profile?: Profile;
    answers?: Answers;
    startedAt?: string;
    completedAt?: string;
    test?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, answers } = body;
  if (!profile?.email || !answers) {
    return NextResponse.json({ error: "Missing submission details" }, { status: 400 });
  }

  // Scores are recalculated here rather than trusted from the browser.
  const result = scoreDiagnostic(answers);

  // Close out the run this belongs to, if the diagnostic is gated.
  const store = getStore();
  if (body.runId && store) {
    const account = await currentAccount();
    if (account) {
      await store.completeRun(body.runId, profile.business ?? "", result.overall);
    }
  }

  const notified = await sendEmail({
    to: SERVER_CONFIG.notifyEmail,
    subject: `${body.test ? "[TEST] " : ""}New diagnostic: ${profile.business} - ${result.overall}/100`,
    html: notificationEmail(profile, result, "completed"),
    replyTo: profile.email,
  });

  return NextResponse.json({ ok: true, notified, overall: result.overall });
}
