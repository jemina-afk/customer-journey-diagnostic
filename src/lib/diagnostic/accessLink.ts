import { createHmac, timingSafeEqual } from "node:crypto";
import type { Profile } from "./types";

/*
  Client access links.

  When the diagnostic is sold on a call rather than off a paywall, the cleanest
  handover is a link that already knows who they are and is already unlocked -
  no code to type, no card, nothing to explain. The payload is signed with a
  server-side secret so a link can't be forged or edited, and it carries an
  expiry so an old one stops working.

  No database involved: everything needed travels inside the signed token.
*/

const SECRET = process.env.DIAGNOSTIC_LINK_SECRET ?? "";
const ADMIN_KEY = process.env.DIAGNOSTIC_ADMIN_KEY ?? "";

export interface AccessPayload {
  /** Name, business, email and business type, all optional. */
  profile: Partial<Profile>;
  /** Which tier they bought, so the call panel shows when it should. */
  tier: string;
  /** Unix seconds. */
  expires: number;
}

export function linksConfigured(): boolean {
  return SECRET.length >= 16 && ADMIN_KEY.length >= 8;
}

export function adminKeyMatches(supplied: string): boolean {
  if (!ADMIN_KEY || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

export function createAccessToken(payload: AccessPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Returns the payload only when the signature is ours and it hasn't expired. */
export function readAccessToken(token: string): AccessPayload | null {
  if (!SECRET || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AccessPayload;
    if (!payload?.expires || payload.expires * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
