import { memoryStore } from "./memory";
import { neonStore } from "./neon";
import type { Store } from "./types";

export type { Account, Run, Store } from "./types";

/*
  Access control is only meaningful when the count lives somewhere shared, so
  the rules here are deliberately strict:

    · DATABASE_URL set        -> Postgres, and the gate can be trusted
    · no DATABASE_URL, dev    -> in-memory, fine for walking the flow locally
    · no DATABASE_URL, prod   -> nothing, and anything needing a gate fails
                                 closed rather than quietly letting people in
*/

/*
  Held on globalThis rather than in a module variable: in development each route
  handler is bundled separately, so a plain module-level cache gives every route
  its own store - and a login token written by one route is then invisible to
  the next. It also survives hot reloads.
*/
const globalForStore = globalThis as typeof globalThis & { __tulivoStore?: Store | null };

export function getStore(): Store | null {
  if (globalForStore.__tulivoStore !== undefined) return globalForStore.__tulivoStore;

  const url = process.env.DATABASE_URL;
  if (url) {
    globalForStore.__tulivoStore = neonStore(url);
  } else if (process.env.NODE_ENV !== "production") {
    globalForStore.__tulivoStore = memoryStore();
  } else {
    globalForStore.__tulivoStore = null;
  }

  return globalForStore.__tulivoStore;
}

export function storeIsPersistent(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
