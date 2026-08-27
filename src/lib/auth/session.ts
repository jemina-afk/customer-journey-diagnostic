import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "@/lib/store";
import type { Account } from "@/lib/store";

/*
  Sign-in by emailed link rather than password.

  The brief was to make password sharing less likely; the surest way is to have
  no password at all. To lend someone else your access you'd have to hand over
  your inbox, and even then the monthly limit sits on the account, not the
  device. It also removes password resets, which is the support cost nobody
  budgets for.
*/

const SECRET = process.env.AUTH_SECRET ?? "";
const COOKIE = "tulivo_session";
const SESSION_DAYS = 30;
const LOGIN_TOKEN_MINUTES = 30;

export const AUTH = {
  /** Access control only applies when this is on. */
  required: process.env.DIAGNOSTIC_REQUIRE_LOGIN === "true",
  /** How many diagnostics an account may start per window. */
  runsPerWindow: Number(process.env.DIAGNOSTIC_RUNS_PER_WINDOW ?? 2),
  /** The rolling window, in days. */
  windowDays: Number(process.env.DIAGNOSTIC_WINDOW_DAYS ?? 30),
};

export function authConfigured(): boolean {
  return SECRET.length >= 16;
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/* ------------------------------------------------------------- login links */

export function newLoginToken(): string {
  return randomBytes(32).toString("base64url");
}

export function loginTokenExpiry(): Date {
  return new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000);
}

export const loginTokenMinutes = LOGIN_TOKEN_MINUTES;

/* ---------------------------------------------------------------- sessions */

/** `accountId.issuedAt.signature` - unforgeable without the secret. */
export function createSessionValue(accountId: string): string {
  const body = `${accountId}.${Date.now()}`;
  return `${body}.${sign(body)}`;
}

export function readSessionValue(value: string | undefined): string | null {
  if (!value || !SECRET) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [accountId, issued, signature] = parts;
  if (!safeEqual(signature, sign(`${accountId}.${issued}`))) return null;
  const age = Date.now() - Number(issued);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_DAYS * 86_400_000) return null;
  return accountId;
}

export const SESSION_COOKIE = COOKIE;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  };
}

export function setSessionCookie(accountId: string): void {
  cookies().set(COOKIE, createSessionValue(accountId), sessionCookieOptions());
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE);
}

/** The signed-in account, or null. */
export async function currentAccount(): Promise<Account | null> {
  const accountId = readSessionValue(cookies().get(COOKIE)?.value);
  if (!accountId) return null;
  const store = getStore();
  if (!store) return null;
  return store.accountById(accountId);
}

/* ------------------------------------------------------------------ quota */

export interface Quota {
  used: number;
  limit: number;
  remaining: number;
  /** When the oldest run in the window ages out, freeing a slot. */
  nextSlotAt: string | null;
}

/*
  What actually spends a slot: a diagnostic they finished, or one started in the
  last day - recent enough that it's the same sitting. A run abandoned a week
  ago gives its slot back, because the limit is meant to cap reports produced,
  not punish someone whose phone rang halfway through.
*/
export function countable(runs: { startedAt: string; completedAt: string | null }[]) {
  const recent = Date.now() - 86_400_000;
  return runs.filter((run) => run.completedAt || new Date(run.startedAt).getTime() > recent);
}

export function windowStart(): Date {
  return new Date(Date.now() - AUTH.windowDays * 86_400_000);
}

export async function quotaFor(accountId: string): Promise<Quota> {
  const store = getStore();
  if (!store) return { used: 0, limit: AUTH.runsPerWindow, remaining: AUTH.runsPerWindow, nextSlotAt: null };

  const runs = await store.runsSince(accountId, windowStart());
  const consuming = countable(runs);
  const used = consuming.length;
  const remaining = Math.max(AUTH.runsPerWindow - used, 0);
  const oldest = consuming[consuming.length - 1];
  const nextSlotAt =
    remaining > 0 || !oldest
      ? null
      : new Date(new Date(oldest.startedAt).getTime() + AUTH.windowDays * 86_400_000).toISOString();

  return { used, limit: AUTH.runsPerWindow, remaining, nextSlotAt };
}
