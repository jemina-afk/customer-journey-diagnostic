"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import { Button, Card, Eyebrow, Field, Wordmark, inputClass } from "./ui";

/*
  No password, by design: a link to their inbox. There's nothing to write down,
  nothing to reset, and nothing to pass around - and the monthly limit sits on
  the account rather than the device, so a shared login doesn't buy extra runs.
*/
export function SignInScreen({
  expired,
  quota,
  windowDays,
  broken,
}: {
  /** They arrived on a link that had already been used or timed out. */
  expired?: boolean;
  quota?: { used: number; limit: number; remaining: number; nextSlotAt: string | null } | null;
  windowDays: number;
  /** Sign-in is switched on but can't run - say so instead of failing quietly. */
  broken?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), origin: window.location.origin }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; devLink?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "That didn't work. Please try again.");
        setState("idle");
        return;
      }
      if (data.devLink) setDevLink(data.devLink);
      setState("sent");
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setState("idle");
    }
  }

  const outOfRuns = quota && quota.remaining === 0;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col justify-center px-5 py-12 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Wordmark />

        {broken ? (
          <>
            <Eyebrow className="mt-10">Not available</Eyebrow>
            <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-tulivo-ink sm:text-[34px]">
              The diagnostic is temporarily closed
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-tulivo-muted">
              Sorry - this is our end, not yours. Please try again shortly, or email{" "}
              <a
                href={`mailto:${DIAGNOSTIC.contactEmail}`}
                className="font-medium text-tulivo-ink underline decoration-tulivo-clay/40 underline-offset-4"
              >
                {DIAGNOSTIC.contactEmail}
              </a>
              .
            </p>
            <Card className="mt-8 p-5">
              <p className="text-[12.5px] leading-relaxed text-tulivo-faint">Configuration: {broken}</p>
            </Card>
          </>
        ) : outOfRuns ? (
          <>
            <Eyebrow className="mt-10">You&apos;ve used this month&apos;s diagnostics</Eyebrow>
            <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-tulivo-ink sm:text-[34px]">
              That&apos;s {quota.limit} in {windowDays} days
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-tulivo-muted">
              A diagnostic is worth running when something has actually changed, so it&apos;s limited
              to {quota.limit} in any {windowDays} days.
              {quota.nextSlotAt && (
                <>
                  {" "}
                  Your next one opens on{" "}
                  <strong className="font-semibold text-tulivo-ink">
                    {new Date(quota.nextSlotAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                    })}
                  </strong>
                  .
                </>
              )}
            </p>
            <Card className="mt-8 p-6">
              <p className="text-[15px] leading-relaxed text-tulivo-muted">
                Need one sooner, or want to go through your results properly?{" "}
                <a
                  href={DIAGNOSTIC.bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-tulivo-ink underline decoration-tulivo-clay/40 underline-offset-4 hover:decoration-tulivo-clay"
                >
                  Book a call
                </a>{" "}
                or email{" "}
                <a
                  href={`mailto:${DIAGNOSTIC.contactEmail}`}
                  className="font-medium text-tulivo-ink underline decoration-tulivo-clay/40 underline-offset-4"
                >
                  {DIAGNOSTIC.contactEmail}
                </a>
                .
              </p>
            </Card>
          </>
        ) : state === "sent" ? (
          <>
            <Eyebrow className="mt-10">Check your inbox</Eyebrow>
            <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-tulivo-ink sm:text-[34px]">
              Your link is on its way
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-tulivo-muted">
              We&apos;ve sent a sign-in link to{" "}
              <strong className="font-semibold text-tulivo-ink">{email.trim()}</strong>. It works
              once and expires in half an hour.
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-tulivo-faint">
              Nothing there after a minute or two? Check spam, or{" "}
              <button
                type="button"
                onClick={() => setState("idle")}
                className="underline underline-offset-4 hover:text-tulivo-muted"
              >
                try a different address
              </button>
              .
            </p>
            {devLink && (
              <Card className="mt-6 p-5">
                <Eyebrow>Development only</Eyebrow>
                <p className="mt-2 text-[13px] leading-relaxed text-tulivo-muted">
                  No email provider is configured, so here&apos;s the link:
                </p>
                <a href={devLink} className="mt-2 block break-all text-[12.5px] text-tulivo-clay underline">
                  {devLink}
                </a>
              </Card>
            )}
          </>
        ) : (
          <>
            <Eyebrow className="mt-10">Customer Journey Diagnostic</Eyebrow>
            <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-tulivo-ink sm:text-[34px]">
              Sign in to begin
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-tulivo-muted">
              No password to remember. Put in your email and we&apos;ll send you a link that signs you
              straight in.
            </p>

            <Card className="mt-8 p-6 sm:p-7">
              <form className="space-y-5" onSubmit={submit}>
                <Field label="Your email address" error={error ?? undefined}>
                  <input
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@yourbusiness.co.uk"
                  />
                </Field>
                <Button type="submit" full disabled={state === "sending" || !email.trim()}>
                  {state === "sending" ? "Sending..." : "Email me a sign-in link"}
                </Button>
              </form>
              {expired && !error && (
                <p className="mt-4 text-[13px] leading-relaxed text-tulivo-red">
                  That link had already been used or expired. Here&apos;s a fresh one.
                </p>
              )}
            </Card>

            <p className="mt-6 text-[13px] leading-relaxed text-tulivo-faint">
              Each account can run the diagnostic {DIAGNOSTIC.runsPerWindowLabel}. Your answers are
              kept to produce your own report and nothing else.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
