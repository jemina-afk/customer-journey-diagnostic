import type { Account, Run, Store } from "./types";

/*
  A local-development stand-in for Postgres, so the whole login and quota flow
  can be walked through with `npm run dev` and no database.

  Never for production: each serverless instance would get its own copy, which
  means no shared usage count and no real limit. `getStore()` refuses to hand
  this out in production.
*/
export function memoryStore(): Store {
  const accounts = new Map<string, Account>();
  const byEmail = new Map<string, string>();
  const tokens = new Map<string, { accountId: string; expiresAt: Date }>();
  const runs = new Map<string, Run>();

  return {
    async init() {},

    async accountByEmail(email) {
      const id = byEmail.get(email.toLowerCase());
      return id ? accounts.get(id) ?? null : null;
    },

    async createAccount(email) {
      const existing = byEmail.get(email.toLowerCase());
      if (existing) return accounts.get(existing) as Account;
      const account: Account = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      accounts.set(account.id, account);
      byEmail.set(account.email, account.id);
      return account;
    },

    async accountById(id) {
      return accounts.get(id) ?? null;
    },

    async saveLoginToken(token, accountId, expiresAt) {
      tokens.set(token, { accountId, expiresAt });
    },

    async consumeLoginToken(token) {
      const found = tokens.get(token);
      tokens.delete(token);
      if (!found || found.expiresAt.getTime() < Date.now()) return null;
      return found.accountId;
    },

    async runsSince(accountId, since) {
      return [...runs.values()]
        .filter((r) => r.accountId === accountId && new Date(r.startedAt) >= since)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },

    async openRun(accountId, since) {
      return (
        [...runs.values()]
          .filter(
            (r) => r.accountId === accountId && !r.completedAt && new Date(r.startedAt) >= since,
          )
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
      );
    },

    async createRun(accountId) {
      const run: Run = {
        id: crypto.randomUUID(),
        accountId,
        startedAt: new Date().toISOString(),
        completedAt: null,
        business: null,
        overall: null,
      };
      runs.set(run.id, run);
      return run;
    },

    async completeRun(runId, business, overall) {
      const run = runs.get(runId);
      if (run && !run.completedAt) {
        runs.set(runId, { ...run, completedAt: new Date().toISOString(), business, overall });
      }
    },
  };
}
