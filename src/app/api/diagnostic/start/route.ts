import { NextResponse } from "next/server";
import {
  AUTH,
  authConfigured,
  countable,
  currentAccount,
  quotaFor,
  windowStart,
} from "@/lib/auth/session";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  Claims a slot before a diagnostic begins. The count lives here rather than in
  the browser, so clearing site data, opening a private window or passing the
  login around doesn't buy anyone an extra one.

  An unfinished run from the last day is handed back instead of a new one, so
  closing the tab halfway through doesn't cost a slot.
*/
export async function POST() {
  if (!AUTH.required) return NextResponse.json({ ok: true, required: false });

  const store = getStore();
  if (!authConfigured() || !store) {
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }

  const account = await currentAccount();
  if (!account) return NextResponse.json({ ok: false, reason: "signed-out" }, { status: 401 });

  const resumable = await store.openRun(account.id, new Date(Date.now() - 86_400_000));
  if (resumable) {
    return NextResponse.json({ ok: true, runId: resumable.id, quota: await quotaFor(account.id) });
  }

  const runs = countable(await store.runsSince(account.id, windowStart()));
  if (runs.length >= AUTH.runsPerWindow) {
    return NextResponse.json(
      { ok: false, reason: "quota", quota: await quotaFor(account.id) },
      { status: 429 },
    );
  }

  const run = await store.createRun(account.id);
  return NextResponse.json({ ok: true, runId: run.id, quota: await quotaFor(account.id) });
}
