import { neon } from "@neondatabase/serverless";
import type { Account, Run, Store } from "./types";

/*
  Postgres, over Neon's HTTP driver so it works on serverless with no pooling
  to manage. Three small tables, created on first use - there's no migration
  step to remember when this deploys.
*/

type Rows = Record<string, unknown>[];

export function neonStore(connectionString: string): Store {
  const sql = neon(connectionString);
  let ready: Promise<void> | null = null;

  function row<T>(rows: Rows): T | null {
    return (rows[0] as T) ?? null;
  }

  const store: Store = {
    async init() {
      if (!ready) {
        ready = (async () => {
          await sql`CREATE TABLE IF NOT EXISTS accounts (
            id text PRIMARY KEY,
            email text NOT NULL UNIQUE,
            created_at timestamptz NOT NULL DEFAULT now()
          )`;
          await sql`CREATE TABLE IF NOT EXISTS login_tokens (
            token text PRIMARY KEY,
            account_id text NOT NULL,
            expires_at timestamptz NOT NULL
          )`;
          await sql`CREATE TABLE IF NOT EXISTS runs (
            id text PRIMARY KEY,
            account_id text NOT NULL,
            started_at timestamptz NOT NULL DEFAULT now(),
            completed_at timestamptz,
            business text,
            overall integer
          )`;
          await sql`CREATE INDEX IF NOT EXISTS runs_account_started ON runs (account_id, started_at DESC)`;
        })();
      }
      return ready;
    },

    async accountByEmail(email) {
      await store.init();
      const rows = (await sql`SELECT id, email, created_at FROM accounts WHERE email = ${email.toLowerCase()}`) as Rows;
      return mapAccount(row(rows));
    },

    async createAccount(email) {
      await store.init();
      const id = crypto.randomUUID();
      const rows = (await sql`
        INSERT INTO accounts (id, email) VALUES (${id}, ${email.toLowerCase()})
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id, email, created_at
      `) as Rows;
      return mapAccount(row(rows)) as Account;
    },

    async accountById(id) {
      await store.init();
      const rows = (await sql`SELECT id, email, created_at FROM accounts WHERE id = ${id}`) as Rows;
      return mapAccount(row(rows));
    },

    async saveLoginToken(token, accountId, expiresAt) {
      await store.init();
      await sql`INSERT INTO login_tokens (token, account_id, expires_at) VALUES (${token}, ${accountId}, ${expiresAt.toISOString()})`;
      // Opportunistic tidy-up; expired tokens are useless either way.
      await sql`DELETE FROM login_tokens WHERE expires_at < now()`;
    },

    async consumeLoginToken(token) {
      await store.init();
      const rows = (await sql`
        DELETE FROM login_tokens WHERE token = ${token} AND expires_at > now()
        RETURNING account_id
      `) as Rows;
      const found = row<{ account_id: string }>(rows);
      return found ? found.account_id : null;
    },

    async runsSince(accountId, since) {
      await store.init();
      const rows = (await sql`
        SELECT id, account_id, started_at, completed_at, business, overall
        FROM runs WHERE account_id = ${accountId} AND started_at >= ${since.toISOString()}
        ORDER BY started_at DESC
      `) as Rows;
      return rows.map((r) => mapRun(r) as Run);
    },

    async openRun(accountId, since) {
      await store.init();
      const rows = (await sql`
        SELECT id, account_id, started_at, completed_at, business, overall
        FROM runs
        WHERE account_id = ${accountId} AND completed_at IS NULL AND started_at >= ${since.toISOString()}
        ORDER BY started_at DESC LIMIT 1
      `) as Rows;
      return mapRun(row(rows));
    },

    async createRun(accountId) {
      await store.init();
      const id = crypto.randomUUID();
      const rows = (await sql`
        INSERT INTO runs (id, account_id) VALUES (${id}, ${accountId})
        RETURNING id, account_id, started_at, completed_at, business, overall
      `) as Rows;
      return mapRun(row(rows)) as Run;
    },

    async completeRun(runId, business, overall) {
      await store.init();
      await sql`
        UPDATE runs SET completed_at = now(), business = ${business}, overall = ${overall}
        WHERE id = ${runId} AND completed_at IS NULL
      `;
    },
  };

  return store;
}

function mapAccount(r: Record<string, unknown> | null): Account | null {
  if (!r) return null;
  return {
    id: String(r.id),
    email: String(r.email),
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function mapRun(r: Record<string, unknown> | null): Run | null {
  if (!r) return null;
  return {
    id: String(r.id),
    accountId: String(r.account_id),
    startedAt: new Date(r.started_at as string).toISOString(),
    completedAt: r.completed_at ? new Date(r.completed_at as string).toISOString() : null,
    business: (r.business as string) ?? null,
    overall: r.overall === null || r.overall === undefined ? null : Number(r.overall),
  };
}
