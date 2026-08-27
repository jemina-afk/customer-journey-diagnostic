/*
  The small amount of state that has to live on a server rather than in
  someone's browser: who has an account, and how many diagnostics they've run.
  A usage limit kept in localStorage is a usage limit anyone can clear.
*/

export interface Account {
  id: string;
  email: string;
  createdAt: string;
}

export interface Run {
  id: string;
  accountId: string;
  startedAt: string;
  completedAt: string | null;
  business: string | null;
  overall: number | null;
}

export interface Store {
  /** Ready the schema. Safe to call repeatedly. */
  init(): Promise<void>;
  accountByEmail(email: string): Promise<Account | null>;
  createAccount(email: string): Promise<Account>;
  accountById(id: string): Promise<Account | null>;
  /** Login tokens are single use: consuming one deletes it. */
  saveLoginToken(token: string, accountId: string, expiresAt: Date): Promise<void>;
  consumeLoginToken(token: string): Promise<string | null>;
  /** Runs started within the window, newest first. */
  runsSince(accountId: string, since: Date): Promise<Run[]>;
  /** An unfinished run they can pick up again without spending another slot. */
  openRun(accountId: string, since: Date): Promise<Run | null>;
  createRun(accountId: string): Promise<Run>;
  completeRun(runId: string, business: string, overall: number): Promise<void>;
}
