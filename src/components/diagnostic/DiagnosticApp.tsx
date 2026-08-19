"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SECTIONS } from "@/lib/diagnostic/sections";
import { completionOf, scoreDiagnostic } from "@/lib/diagnostic/scoring";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import { downloadReport, reportDataUri } from "@/lib/diagnostic/pdf";
import {
  clearSession,
  emptySession,
  loadSession,
  saveSession,
  type StoredSession,
} from "@/lib/diagnostic/storage";
import type { AnswerValue, Profile } from "@/lib/diagnostic/types";
import { ResultsScreen } from "./ResultsScreen";
import { SectionScreen } from "./SectionScreen";
import { WelcomeScreen } from "./WelcomeScreen";

type Stage = "welcome" | "sections" | "results";

export function DiagnosticApp() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [stage, setStage] = useState<Stage>("welcome");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const submitted = useRef(false);
  const emailed = useRef(false);

  // Restore an in-progress diagnostic, and pick up a return trip from Stripe.
  useEffect(() => {
    const restored = loadSession() ?? emptySession();
    setSession(restored);
    if (restored.completedAt) {
      setStage("results");
      submitted.current = true;
    } else if (restored.profile) {
      setStage("sections");
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutSession = params.get("session_id");
    if (checkoutSession) {
      verifyPayment(checkoutSession).then((ok) => {
        if (ok) {
          setSession((s) => (s ? { ...s, unlocked: true } : s));
          setStage("results");
        } else {
          setUnlockError("We couldn't confirm that payment. If you've been charged, email us and we'll unlock it straight away.");
        }
        window.history.replaceState({}, "", window.location.pathname);
      });
    }
  }, []);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  const answers = useMemo(() => session?.answers ?? {}, [session?.answers]);
  const result = useMemo(() => scoreDiagnostic(answers), [answers]);
  const progress = useMemo(() => completionOf(answers), [answers]);
  const index = session?.sectionIndex ?? 0;

  const persist = useCallback((patch: Partial<StoredSession>) => {
    setSession((s) => (s ? { ...s, ...patch } : s));
  }, []);

  function start(profile: Profile) {
    persist({ profile, sectionIndex: 0 });
    setStage("sections");
  }

  function answer(key: string, value: AnswerValue) {
    setSession((s) => (s ? { ...s, answers: { ...s.answers, [key]: value } } : s));
  }

  function next() {
    if (!session) return;
    if (index < SECTIONS.length - 1) {
      persist({ sectionIndex: index + 1 });
      return;
    }
    const completedAt = new Date().toISOString();
    persist({ completedAt });
    setStage("results");
    void submit({ ...session, completedAt });
  }

  function back() {
    if (!session) return;
    if (index === 0) {
      setStage("welcome");
      return;
    }
    persist({ sectionIndex: index - 1 });
  }

  /** Fire-and-forget lead capture — a failure here never blocks the results. */
  async function submit(current: StoredSession) {
    if (submitted.current || !current.profile) return;
    submitted.current = true;
    try {
      await fetch("/api/diagnostic/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current.id,
          profile: current.profile,
          answers: current.answers,
          startedAt: current.startedAt,
          completedAt: current.completedAt,
        }),
      });
    } catch {
      // Offline or blocked — their results still work.
    }
  }

  async function verifyPayment(checkoutSessionId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/diagnostic/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutSessionId }),
      });
      const data = (await res.json()) as { paid?: boolean };
      return Boolean(data.paid);
    } catch {
      return false;
    }
  }

  async function unlock() {
    if (!session?.profile) return;
    setUnlockError(null);
    setUnlocking(true);
    try {
      const res = await fetch("/api/diagnostic/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.id,
          profile: session.profile,
          overall: result.overall,
          returnUrl: window.location.origin + window.location.pathname,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (DIAGNOSTIC.checkoutUrl) {
        window.location.href = DIAGNOSTIC.checkoutUrl;
        return;
      }
      setUnlockError(
        data.error ??
          `Checkout isn't connected yet. Email ${DIAGNOSTIC.contactEmail} and we'll send you a payment link and unlock your report.`,
      );
    } catch {
      setUnlockError(`Something went wrong. Email ${DIAGNOSTIC.contactEmail} and we'll sort it out.`);
    } finally {
      setUnlocking(false);
    }
  }

  async function redeem(code: string) {
    if (!code) return;
    setUnlockError(null);
    try {
      const res = await fetch("/api/diagnostic/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, id: session?.id }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) {
        persist({ unlocked: true });
      } else {
        setUnlockError("That code wasn't recognised. Check it and try again.");
      }
    } catch {
      setUnlockError("We couldn't check that code just now. Please try again.");
    }
  }

  async function download() {
    if (!session?.profile) return;
    setDownloading(true);
    try {
      await downloadReport(result, session.profile);
    } finally {
      setDownloading(false);
    }
  }

  // Once unlocked, email the report through so they have it without downloading.
  useEffect(() => {
    if (!session?.unlocked || !session.profile || emailed.current) return;
    emailed.current = true;
    const profile = session.profile;
    void (async () => {
      try {
        const pdf = await reportDataUri(result, profile);
        await fetch("/api/diagnostic/email-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: session.id,
            profile,
            answers: session.answers,
            pdf,
          }),
        });
      } catch {
        // They can still download it from the results screen.
      }
    })();
  }, [session?.unlocked, session?.profile, session?.id, session?.answers, result]);

  function restart() {
    clearSession();
    submitted.current = false;
    emailed.current = false;
    setSession(emptySession());
    setStage("welcome");
  }

  if (!session) {
    return <div className="min-h-screen" aria-busy />;
  }

  return (
    <AnimatePresence mode="wait">
      {stage === "welcome" && (
        <motion.div key="welcome" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
          <WelcomeScreen initial={session.profile} onStart={start} />
        </motion.div>
      )}

      {stage === "sections" && (
        <motion.div key="sections" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <SectionScreen
            section={SECTIONS[index]}
            index={index}
            answers={answers}
            onAnswer={answer}
            onBack={back}
            onNext={next}
            progress={progress}
          />
        </motion.div>
      )}

      {stage === "results" && session.profile && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <ResultsScreen
            result={result}
            profile={session.profile}
            unlocked={Boolean(session.unlocked)}
            unlocking={unlocking}
            unlockError={unlockError}
            onUnlock={unlock}
            onRedeemCode={redeem}
            onDownload={download}
            downloading={downloading}
            onRestart={restart}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
