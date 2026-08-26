"use client";

import type { Answers, Profile } from "./types";

/*
  Session persistence. The diagnostic takes 10–15 minutes, so progress is saved
  to localStorage on every answer - a dropped connection or a closed tab never
  costs someone their answers.
*/

const KEY = "tulivo.diagnostic.v1";

export interface StoredSession {
  id: string;
  profile: Profile | null;
  answers: Answers;
  sectionIndex: number;
  startedAt: string;
  completedAt: string | null;
  unlocked: boolean;
  /** Which tier was bought - "call" adds the walkthrough. */
  tier?: string;
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptySession(): StoredSession {
  return {
    id: newSessionId(),
    profile: null,
    answers: {},
    sectionIndex: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    unlocked: false,
  };
}

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return { ...emptySession(), ...parsed };
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Private browsing or a full quota - the diagnostic still works in memory.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
