"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import { STATUS_LABEL, annualValueOfOneMoreClientPerMonth } from "@/lib/diagnostic/scoring";
import { estimateImpact, formatMoney } from "@/lib/diagnostic/impact";
import { currencyFor } from "@/lib/diagnostic/currency";
import { toolsFor } from "@/lib/diagnostic/tools";
import type { Answers, DiagnosticResult, Profile, SectionResult } from "@/lib/diagnostic/types";
import { RadarChart, ScoreDial } from "./RadarChart";
import { Locked, LockIcon } from "./Locked";
import { Button, Card, Eyebrow, Rule, StatusDot, Wordmark, inputClass } from "./ui";

const ORDINAL = ["#1 Priority", "#2 Priority", "#3 Priority"];

export function ResultsScreen({
  result,
  profile,
  answers,
  unlocked,
  tier,
  paymentBypassed,
  onUnlock,
  onDownload,
  unlockError,
  unlocking,
  onRedeemCode,
  downloading,
  onRestart,
}: {
  result: DiagnosticResult;
  profile: Profile;
  answers: Answers;
  unlocked: boolean;
  /** Which tier was bought, when one was. */
  tier: string | null;
  /** No payment method is connected, so unlocking is currently free. */
  paymentBypassed: boolean;
  unlocking: boolean;
  unlockError: string | null;
  onUnlock: (tier: string) => void;
  onRedeemCode: (code: string) => void;
  onDownload: () => void;
  downloading: boolean;
  onRestart: () => void;
}) {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const currency = useMemo(() => currencyFor(profile.currency), [profile.currency]);
  const impact = useMemo(
    () => estimateImpact(answers, currency, result.overall, result.sections),
    [answers, currency, result.overall, result.sections],
  );

  /*
    A roadmap, not an equal write-up of eight stages: the two or three the
    costs point at go in depth, and everything else is listed at the end.
  */
  const byCost = result.priorities.filter((s) => s.status !== "green").slice(0, 3);
  const roadmap = byCost.length > 0 ? byCost : result.priorities.slice(0, 2);
  const inRoadmap = new Set(roadmap.map((s) => s.id));
  const laterStages = result.sections.filter((s) => !inRoadmap.has(s.id));

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Wordmark />
        <span className="text-[12px] text-tulivo-faint">
          Prepared for {profile.business} · {new Date(result.completedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* ---------- Score ---------- */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 grid items-center gap-10 lg:grid-cols-[auto_1fr] lg:gap-14"
      >
        <div className="mx-auto lg:mx-0">
          <ScoreDial score={result.overall} label={result.bandLabel} />
        </div>
        <div>
          <Eyebrow>Your customer journey score</Eyebrow>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] text-tulivo-ink sm:text-[38px]">
            {result.bandLabel === "Optimised"
              ? "Your journey is holding together well."
              : result.bandLabel === "Functional"
                ? "Your journey works - but it's leaking in places."
                : result.bandLabel === "Leaking"
                  ? "You're losing clients you could be winning."
                  : "You're losing people at almost every stage."}
          </h1>
          <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-tulivo-muted sm:text-[17px]">
            {result.bandSummary}
          </p>
          {result.clientValue && (
            <p className="mt-5 max-w-[60ch] rounded-[4px] border border-tulivo-line bg-tulivo-section/50 px-4 py-3.5 text-[15px] leading-relaxed text-tulivo-ink">
              At {result.clientValue.label} per client, just one extra client a month adds around{" "}
              <strong className="tabular font-semibold">
                {annualValueOfOneMoreClientPerMonth(result.clientValue, currency)}
              </strong>{" "}
              in lifetime value over a year - that&apos;s the bar every fix below has to clear.
            </p>
          )}
        </div>
      </motion.section>

      {/* ---------- What it's costing ---------- */}
      {!impact.available && (
        <section className="mt-12">
          <Card className="p-6 sm:p-8">
            <Eyebrow>What the gaps are costing</Eyebrow>
            <p className="mt-4 max-w-[62ch] text-[17px] leading-[1.65] text-tulivo-ink">
              Add your appointment numbers to see what these gaps cost.
            </p>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-tulivo-muted">
              Two answers are all it takes: how many appointments you do in a normal week, and
              what one is worth on average. Without them the scores still stand, but there is no
              honest way to put a figure on them.
            </p>
          </Card>
        </section>
      )}

      {impact.available && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12"
        >
          <Card className="overflow-hidden border-tulivo-purple/25">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
              <div>
                <Eyebrow>What the gaps are costing you</Eyebrow>
                <div className="tabular mt-4 text-[44px] font-semibold leading-none tracking-[-0.04em] text-tulivo-ink sm:text-[52px]">
                  {formatMoney(impact.recoverable, currency)}
                </div>
                <p className="mt-2 text-[15px] font-medium text-tulivo-muted">recoverable a year</p>
                <p className="mt-4 text-[14px] leading-relaxed text-tulivo-muted">
                  A conservative estimate, built from the numbers you gave us - not from what&apos;s
                  theoretically possible.
                </p>
              </div>

              <div>
                <ul className="space-y-4">
                  {impact.leaks.map((leak) => (
                    <li key={leak.id} className="border-b border-tulivo-hairline pb-4 last:border-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[15px] font-medium text-tulivo-ink">{leak.label}</span>
                        <span className="tabular text-[16px] font-semibold text-tulivo-ink">
                          {formatMoney(leak.annual, currency)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-tulivo-faint">{leak.basis}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[12px] leading-relaxed text-tulivo-faint">
                  {impact.assumptions.join(" ")} That is an estimated{" "}
                  {formatMoney(impact.annualRevenue, currency)} a year, and the total above is held
                  to 15% of it. Figures are estimates and rounded.
                </p>
              </div>
            </div>
          </Card>
        </motion.section>
      )}

      {/* ---------- Radar + section scores ---------- */}
      <section className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6 sm:p-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-tulivo-muted">
            Your journey shape
          </h2>
          <div className="mt-4">
            <RadarChart sections={result.sections} />
          </div>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-tulivo-faint">
            Where the shape dips is where clients drop out.
          </p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-tulivo-muted">
            Stage by stage
          </h2>
          <ul className="mt-5 space-y-5">
            {result.sections.map((section, i) => (
              <li key={section.id}>
                <ScoreRow section={section} delay={i * 0.05} />
                <p className="mt-1.5 text-[13.5px] leading-snug text-tulivo-muted">
                  {section.gaps[0] ?? section.verdict}
                </p>
              </li>
            ))}
          </ul>
          <Rule className="my-5" />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-tulivo-muted">
            <span className="inline-flex items-center gap-2">
              <StatusDot status="green" /> Strong (75+)
            </span>
            <span className="inline-flex items-center gap-2">
              <StatusDot status="amber" /> Needs work (50-74)
            </span>
            <span className="inline-flex items-center gap-2">
              <StatusDot status="red" /> Critical gap (under 50)
            </span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-tulivo-faint">
            Manual means it depends on somebody remembering. Systemised means there is a
            process, but it still needs you. Automated means it happens without anyone
            thinking about it.
          </p>
        </Card>
      </section>

      {/* ---------- Priorities ---------- */}
      <section className="mt-14">
        <Eyebrow>{result.priorities.length === 0 ? "Nothing here needs fixing" : "What to fix first"}</Eyebrow>
        <h2 className="mt-3 text-[30px] font-medium tracking-[-0.038em] text-tulivo-head">
          {result.priorities.length === 0
            ? "Refine and protect"
            : result.priorities.length === 1
              ? "Your one priority area"
              : `Your ${result.priorities.length === 2 ? "two" : "three"} priority areas`}
        </h2>
        <p className="mt-4 max-w-[66ch] text-[16px] leading-[1.65] text-tulivo-muted">
          {result.priorities.length === 0 ? (
            <>
              Every stage is working. There is no gap here worth a quarter of your time, so the
              plan below is an upgrade rather than a repair:{" "}
              <strong className="font-medium text-tulivo-head">
                {result.cycle.priorities[0]?.stage ?? "your strongest stage"}
              </strong>
              , taken a level further.
            </>
          ) : (
            <>
              Ranked by what each one is costing you, not simply by score. A stage that is already
              working is left alone, however tempting it is to list it.
            </>
          )}
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {result.priorities.map((section, i) => (
            <Card key={section.id} className="flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tulivo-muted">
                  {ORDINAL[i]}
                </span>
                <StatusDot status={section.status} />
              </div>
              <h3 className="mt-3 text-[19px] font-semibold tracking-[-0.02em] text-tulivo-ink">
                {section.title}
              </h3>
              <p className="tabular mt-1 text-[13px] text-tulivo-muted">
                {section.score}/100 · {STATUS_LABEL[section.status]}
              </p>

              <div className="mt-5 flex-1 space-y-3">
                {unlocked ? (
                  <UnlockedPriority section={section} />
                ) : (
                  <Locked label="Unlock" className="h-full">
                    <div className="space-y-3">
                      <LockedLine title="What's broken" body={section.gaps[0] ?? section.verdict} />
                      <LockedLine
                        title="How to fix it"
                        body={section.fixes[0]?.action ?? "Your specific action steps"}
                      />
                      <LockedLine
                        title="Impact if fixed"
                        body={section.fixes[0]?.impact ?? "What this is worth to you"}
                      />
                    </div>
                  </Locked>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Paywall ---------- */}
      {!unlocked && (
        <section className="mt-14">
          <Card className="overflow-hidden">
            <div className="border-b border-tulivo-line bg-tulivo-section/60 px-6 py-8 text-center sm:px-10 sm:py-10">
              <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-tulivo-ink sm:text-[32px]">
                You&apos;ve identified the gaps.
                <br className="hidden sm:block" /> Now get the solutions.
              </h2>
              <p className="mx-auto mt-4 max-w-[58ch] text-[15px] leading-relaxed text-tulivo-muted">
                {impact.available ? (
                  <>
                    Roughly{" "}
                    <strong className="font-semibold text-tulivo-ink">
                      {formatMoney(impact.recoverable, currency)} a year
                    </strong>{" "}
                    is sitting in these three areas:
                  </>
                ) : (
                  <>
                    Your diagnostic revealed{" "}
                    {result.priorities.filter((p) => p.status !== "green").length || 3} areas costing you
                    clients right now:
                  </>
                )}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {result.priorities.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-2 rounded-full border border-tulivo-line bg-tulivo-card px-3.5 py-2 text-[13px] font-medium text-tulivo-ink"
                  >
                    <StatusDot status={p.status} />
                    {p.title}
                    <span className="tabular text-tulivo-muted">{p.score}/100</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10">
              {paymentBypassed && (
                <p className="mb-7 rounded-[4px] border border-tulivo-purple/40 bg-tulivo-section/70 px-4 py-3.5 text-[13px] leading-relaxed text-tulivo-ink">
                  <strong className="font-medium">Payment isn&apos;t connected yet.</strong> This is the
                  closed view, as someone sees it before they pay. The button below unlocks the report
                  without charging, and the switch at the bottom of the screen moves between the two
                  views. Connecting Stripe ends both.
                </p>
              )}

              {DIAGNOSTIC.tiers.map((option) => (
                <div
                  key={option.id}
                  className="mx-auto flex max-w-[520px] flex-col rounded-[4px] border border-tulivo-purple/45 bg-tulivo-section/40 p-6 sm:p-8"
                >
                  <h3 className="text-[20px] font-medium tracking-[-0.035em] text-tulivo-head">
                    {option.name}
                  </h3>
                  <div className="mt-3 text-[44px] font-medium leading-none tracking-[-0.045em] text-tulivo-head">
                    {DIAGNOSTIC.currencySymbol}
                    {option.price}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-tulivo-muted">{option.blurb}</p>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {option.features.map((line) => (
                      <li key={line} className="flex gap-2.5 text-[15px] leading-relaxed text-tulivo-ink">
                        <CheckMark />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-7"
                    full
                    onClick={() => onUnlock(option.id)}
                    disabled={unlocking}
                  >
                    {unlocking ? "Opening checkout…" : "Get my full report"}
                  </Button>

                  <p className="mt-4 text-[14px] leading-relaxed text-tulivo-muted">
                    If you&rsquo;d like help putting it in place, the{" "}
                    {DIAGNOSTIC.currencySymbol}
                    {option.price} comes off any system or partnership you book within 30 days.
                  </p>
                </div>
              ))}

              {unlockError && (
                <p className="mt-4 text-center text-[13px] leading-relaxed text-tulivo-red">{unlockError}</p>
              )}

              <div className="mt-7 text-center">
                <p className="text-[13px] leading-relaxed text-tulivo-muted">
                  {impact.available ? (
                    <>
                      A one-off {DIAGNOSTIC.currencySymbol}
                      {DIAGNOSTIC.tiers[0].price}, set against roughly{" "}
                      <strong className="font-medium text-tulivo-head">
                        {formatMoney(impact.recoverable, currency)}
                      </strong>{" "}
                      a year currently leaking out of your journey.
                    </>
                  ) : (
                    <>
                      A one-off {DIAGNOSTIC.currencySymbol}
                      {DIAGNOSTIC.tiers[0].price}, and yours to keep.
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setShowCode((value) => !value)}
                  className="mt-4 text-[12px] text-tulivo-faint underline underline-offset-4 hover:text-tulivo-muted"
                >
                  Already paid? Enter your unlock code
                </button>
                {showCode && (
                  <form
                    className="mx-auto mt-3 flex max-w-[340px] gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onRedeemCode(code.trim());
                    }}
                  >
                    <input
                      className={`${inputClass} min-h-[46px] text-[14px]`}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Unlock code"
                      aria-label="Unlock code"
                    />
                    <Button type="submit" variant="ghost" className="min-h-[46px] px-5 text-[14px]">
                      Unlock
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ---------- Unlocked report ---------- */}
      {unlocked && (
        <section className="mt-14">
          <Card className="flex flex-col items-start gap-5 border-tulivo-purple/30 bg-tulivo-section/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <Eyebrow>Unlocked</Eyebrow>
              <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-tulivo-ink">
                Your full diagnostic report is ready
              </h2>
              <p className="mt-1.5 text-[14px] text-tulivo-muted">
                {DIAGNOSTIC.reportPages} pages, written from your answers. A copy has been emailed to{" "}
                {profile.email}.
              </p>
            </div>
            <Button onClick={onDownload} disabled={downloading} className="w-full sm:w-auto">
              {downloading ? "Preparing…" : "Download your report (PDF)"}
            </Button>
          </Card>

          <Card className="mt-4 flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <Eyebrow>Talk it through</Eyebrow>
              <h2 className="mt-2 text-[22px] font-medium tracking-[-0.035em] text-tulivo-head">
                Book a free 30-minute walkthrough
              </h2>
              <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-tulivo-muted">
                Book a free 30-minute walkthrough of your report. We&rsquo;ll agree the one thing
                to fix first, and you&rsquo;ll leave knowing exactly what to do next.
              </p>
            </div>
            <a
              href={DIAGNOSTIC.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto"
            >
              <Button full>Book your free walkthrough</Button>
            </a>
          </Card>

          <div className="mt-10">
            <Eyebrow>This week</Eyebrow>
            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.025em] text-tulivo-ink">
              Three things you can do now
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {result.quickWins.map((win, i) => (
                <Card key={win.action} className="p-6">
                  <span className="tabular text-[11px] font-semibold uppercase tracking-[0.2em] text-tulivo-muted">
                    Win {i + 1}
                  </span>
                  <p className="mt-3 text-[15px] leading-relaxed text-tulivo-ink">{win.action}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-tulivo-muted">{win.impact}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <Eyebrow>Your 90-day focus</Eyebrow>
            <h2 className="mt-3 text-[30px] font-medium tracking-[-0.038em] text-tulivo-head">
              One number, three or four priorities
            </h2>
            <p className="mt-4 max-w-[68ch] text-[16px] leading-[1.65] text-tulivo-muted">
              {result.cycle.explainer}
            </p>
            <div className="mt-5 max-w-[68ch] rounded-[4px] border-l-2 border-tulivo-purple/50 bg-tulivo-section/50 py-4 pl-5 pr-5">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-tulivo-muted">
                Why this number, and not one of the other seven
              </p>
              <p className="mt-2.5 text-[15px] leading-[1.65] text-tulivo-ink">
                {result.cycle.chosenBecause}
              </p>
            </div>

            <Card className="mt-7 overflow-hidden border-tulivo-purple/25">
              <div className="grid gap-6 border-b border-tulivo-line bg-tulivo-section/50 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tulivo-muted">
                    Your focus KPI
                  </p>
                  <h3 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-tulivo-ink">
                    {result.cycle.kpi}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-tulivo-muted">{result.cycle.metric}</p>
                  <p className="mt-4 text-[15px] leading-[1.6] text-tulivo-ink">{result.cycle.why}</p>
                  <div className="mt-5 border-t border-tulivo-line pt-4">
                    <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-tulivo-muted">
                      What you get when it moves
                    </p>
                    <p className="mt-2 text-[15px] leading-[1.6] text-tulivo-ink">
                      {result.cycle.benefit}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 self-start">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[4px] border border-tulivo-line bg-tulivo-card p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tulivo-faint">
                        Today
                      </p>
                      <p className="mt-1.5 text-[16px] font-semibold leading-snug text-tulivo-ink">
                        {result.cycle.current ?? "Not measured yet"}
                      </p>
                    </div>
                    <div className="rounded-[4px] border border-tulivo-purple/35 bg-tulivo-section/60 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tulivo-muted">
                        In 90 days
                      </p>
                      <p className="mt-1.5 text-[16px] font-semibold leading-snug text-tulivo-ink">
                        {result.cycle.target}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[4px] border border-tulivo-line bg-tulivo-card p-5">
                    <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-tulivo-muted">
                      How to measure it
                    </p>
                    <p className="mt-3 text-[15px] leading-relaxed text-tulivo-ink">
                      Track the following data: {lowerFirst(result.cycle.measure.what)}
                    </p>
                    <div className="mt-4 space-y-3 border-t border-tulivo-hairline pt-4">
                      <div>
                        <p className="text-[13px] font-medium text-tulivo-head">Where to get it</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-tulivo-muted">
                          {result.cycle.measure.where}
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-tulivo-head">How often to check</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-tulivo-muted">
                          {result.cycle.measure.cadence}
                        </p>
                      </div>
                    </div>
                  </div>
                  {result.cycle.worth !== null && (
                    <div className="rounded-[4px] border border-tulivo-line bg-tulivo-card p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tulivo-faint">
                        Worth
                      </p>
                      <p className="tabular mt-1.5 text-[16px] font-semibold text-tulivo-ink">
                        {formatMoney(result.cycle.worth, currency)} a year
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <ol className="space-y-5">
                  {result.cycle.priorities.map((priority, i) => (
                    <li key={priority.title} className="flex gap-4 sm:gap-5">
                      <span className="tabular mt-[2px] flex h-8 w-8 flex-none items-center justify-center rounded-full border border-tulivo-purple/35 bg-tulivo-section/50 text-[13px] font-semibold text-tulivo-muted">
                        {i + 1}
                      </span>
                      <div className="flex-1 border-b border-tulivo-hairline pb-5 last:border-0 last:pb-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h4 className="text-[17px] font-semibold tracking-[-0.02em] text-tulivo-ink">
                            {priority.title}
                          </h4>
                          <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-tulivo-faint">
                            {priority.window}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-tulivo-muted">via {priority.stage}</p>
                        <ul className="mt-3 space-y-2.5">
                          {priority.steps.map((step) => (
                            <li key={step} className="flex gap-3 text-[15px] leading-relaxed text-tulivo-muted">
                              <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-tulivo-purple/60" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>

            {result.cycle.later.length > 0 && (
              <Card className="mt-4 border-dashed p-6 sm:p-7">
                <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-tulivo-muted">
                  Not this quarter, but still a concern
                </p>
                <p className="mt-3 max-w-[70ch] text-[15px] leading-[1.65] text-tulivo-ink">
                  These stages also scored below where they should be. They are deliberately
                  not in the plan above, because a quarter spent on everything is a quarter
                  spent on nothing. Leave them until the number above has moved and held,
                  then they become the next cycle.
                </p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {result.cycle.later.map((item) => (
                    <li
                      key={item.stage}
                      className="flex items-baseline gap-3 rounded-[4px] bg-tulivo-section/50 px-4 py-3"
                    >
                      <StatusDot status={item.status} className="translate-y-[3px]" />
                      <span className="flex-1 text-[14.5px] leading-snug text-tulivo-ink">
                        {item.stage}
                        <span className="mt-0.5 block text-[13px] text-tulivo-muted">
                          {item.kpi}
                        </span>
                      </span>
                      <span className="tabular text-[14px] font-medium text-tulivo-muted">
                        {item.score}/100
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {result.cycle.next && (
              <Card className="mt-4 flex flex-col gap-3 border-dashed p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tulivo-faint">
                    Then the next cycle
                  </p>
                  <p className="mt-2 text-[16px] font-medium text-tulivo-ink">
                    {result.cycle.next.kpi} - {result.cycle.next.stage}
                  </p>
                </div>
                <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-tulivo-muted">
                  Once this number moves and holds, the next ninety days take on the next one. That&apos;s
                  how the whole journey lifts without ever splitting your attention.
                </p>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ---------- The roadmap ---------- */}
      <section className="mt-14">
        <Eyebrow>The roadmap</Eyebrow>
        <h2 className="mt-3 text-[30px] font-medium tracking-[-0.038em] text-tulivo-head">
          {roadmap.length === 1 ? "The stage to work on" : `The ${roadmap.length} stages to work on`}
        </h2>
        <p className="mt-4 max-w-[70ch] text-[16px] leading-[1.65] text-tulivo-muted">
          Not all eight. These are the stages your own numbers say are costing you the
          most, and they are the ones the next three months are for. The rest are listed
          at the end, so you know what is waiting.
        </p>
        <div className="mt-7 space-y-4">
          {roadmap.map((section) => (
            <Card key={section.id} className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusDot status={section.status} />
                  <h3 className="text-[20px] font-medium tracking-[-0.035em] text-tulivo-head">
                    {section.title}
                  </h3>
                  <LevelChip level={section.level} />
                </div>
                <span className="tabular text-[14px] font-medium text-tulivo-muted">
                  {section.score}/100 · {STATUS_LABEL[section.status]}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-tulivo-line">
                <div
                  className={cn(
                    "h-full rounded-full",
                    section.status === "green" && "bg-tulivo-green",
                    section.status === "amber" && "bg-tulivo-amber",
                    section.status === "red" && "bg-tulivo-red",
                  )}
                  style={{ width: `${section.score}%` }}
                />
              </div>

              <div className="mt-5">
                {unlocked ? (
                  <SectionDetail section={section} />
                ) : (
                  <Locked maxHeight={230}>
                    <SectionDetail section={section} />
                  </Locked>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Your next cycle ---------- */}
      {laterStages.length > 0 && (
        <section className="mt-14">
          <Eyebrow>After this quarter</Eyebrow>
          <h2 className="mt-3 text-[30px] font-medium tracking-[-0.038em] text-tulivo-head">
            Your next cycle
          </h2>
          <p className="mt-4 max-w-[70ch] text-[16px] leading-[1.65] text-tulivo-muted">
            These stages are not in the roadmap on purpose. A quarter spent on everything
            is a quarter spent on nothing. They are here so you know what is waiting, not
            so you start on them now.
          </p>
          <ul className="mt-7 space-y-3">
            {laterStages.map((section) => (
              <li
                key={section.id}
                className="rounded-[4px] border border-tulivo-line bg-tulivo-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="flex items-center gap-3">
                    <StatusDot status={section.status} />
                    <h3 className="text-[17px] font-medium tracking-[-0.03em] text-tulivo-head">
                      {section.title}
                    </h3>
                    <LevelChip level={section.level} />
                  </div>
                  <span className="tabular text-[14px] font-medium text-tulivo-muted">
                    {section.score}/100
                  </span>
                </div>
                <p className="mt-2.5 text-[15px] leading-relaxed text-tulivo-muted">
                  {section.gaps[0] ?? section.verdict}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[70ch] text-[16px] leading-[1.65] text-tulivo-ink">
            Re-run the diagnostic in 90 days. When your focus number has moved and held,
            your next cycle starts with{" "}
            <strong className="font-medium text-tulivo-head">
              {result.cycle.next?.stage ?? laterStages[0].title}
            </strong>
            .
          </p>
        </section>
      )}

      {/* ---------- Next steps ---------- */}
      <section className="mt-14">
        <Card className="p-6 sm:p-10">
          <Eyebrow>Where to go from here</Eyebrow>
          <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.025em] text-tulivo-ink">
            Three ways to close these gaps
          </h2>
          <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-tulivo-muted">
            Your 90-day focus above is one full cycle - the same shape the LEAP sprint runs. You can
            absolutely run it yourself. The real question is how much of it you want to carry alone.
          </p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {DIAGNOSTIC.offers.map((offer) => (
              <div
                key={offer.name}
                className={cn(
                  "flex flex-col rounded-[4px] border p-5",
                  offer.emphasis
                    ? "border-tulivo-purple/40 bg-tulivo-section/40 shadow-[0_16px_36px_-30px_rgba(154,71,47,0.8)]"
                    : "border-tulivo-line bg-tulivo-section/40",
                )}
              >
                <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-tulivo-ink">{offer.name}</h3>
                <p className="mt-1 text-[13px] font-medium text-tulivo-muted">{offer.price}</p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-tulivo-muted">{offer.description}</p>
                {offer.label && (
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-tulivo-muted">
                    {offer.label}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-7 max-w-[70ch] text-[15px] leading-relaxed text-tulivo-muted">
            We&apos;ll go through your roadmap, agree the one thing to fix first, and look
            at which parts are worth building properly.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={DIAGNOSTIC.bookingUrl} target="_blank" rel="noreferrer" className="sm:w-auto">
              <Button variant={unlocked ? "primary" : "ghost"} full>
                Book your free 30-minute walkthrough
              </Button>
            </a>
            <button
              type="button"
              onClick={onRestart}
              className="text-[13px] text-tulivo-faint underline underline-offset-4 hover:text-tulivo-muted"
            >
              Start a new diagnostic
            </button>
          </div>
          <p className="mt-6 max-w-[70ch] rounded-[4px] bg-tulivo-section/70 p-4 text-[15px] leading-relaxed text-tulivo-ink">
            If you&apos;d like help putting it in place, your {DIAGNOSTIC.currencySymbol}
            {DIAGNOSTIC.tiers[0].price} comes off any system or partnership you book within
            30 days.
          </p>
        </Card>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-tulivo-line pt-6 text-[12px] text-tulivo-faint">
        <span>
          {DIAGNOSTIC.consultant} · {DIAGNOSTIC.company}
        </span>
        <a href={`mailto:${DIAGNOSTIC.contactEmail}`} className="hover:text-tulivo-muted">
          {DIAGNOSTIC.contactEmail}
        </a>
      </footer>
    </div>
  );
}

/* Manual, Systemised or Automated: how the stage is run, not how well. */
function LevelChip({ level }: { level: SectionResult["level"] }) {
  return (
    <span
      className={cn(
        "rounded-pill border px-2.5 py-[3px] text-[10px] font-medium uppercase tracking-[0.14em]",
        level === "Automated" && "border-tulivo-green/50 text-tulivo-green",
        level === "Systemised" && "border-tulivo-purple/50 text-tulivo-purple",
        level === "Manual" && "border-tulivo-line text-tulivo-muted",
      )}
    >
      {level}
    </span>
  );
}

function ScoreRow({ section, delay }: { section: SectionResult; delay: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 text-[14px] font-medium text-tulivo-ink">
          <StatusDot status={section.status} />
          {section.title}
        </span>
        <span className="tabular text-[14px] font-semibold text-tulivo-ink">{section.score}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-tulivo-line">
        <motion.div
          className={cn(
            "h-full rounded-full",
            section.status === "green" && "bg-tulivo-green",
            section.status === "amber" && "bg-tulivo-amber",
            section.status === "red" && "bg-tulivo-red",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${section.score}%` }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function LockedLine({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tulivo-faint">{title}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-tulivo-muted">{body}</p>
    </div>
  );
}

function UnlockedPriority({ section }: { section: SectionResult }) {
  const fix = section.fixes[0];
  return (
    <div className="space-y-3">
      <LockedLine title="What's broken" body={section.gaps[0] ?? section.verdict} />
      {fix && <LockedLine title="How to fix it" body={fix.action} />}
      {fix && <LockedLine title="Impact if fixed" body={fix.impact} />}
    </div>
  );
}

function SectionDetail({ section }: { section: SectionResult }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="text-[15px] leading-relaxed text-tulivo-muted">{section.verdict}</p>
        {section.strengths.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tulivo-green">
              What&apos;s working
            </p>
            <ul className="mt-2.5 space-y-2">
              {section.strengths.map((s) => (
                <li key={s} className="flex gap-2.5 text-[14px] leading-relaxed text-tulivo-ink">
                  <span className="mt-[8px] h-1.5 w-1.5 flex-none rounded-full bg-tulivo-green" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {section.gaps.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tulivo-red">
              Gaps identified
            </p>
            <ul className="mt-2.5 space-y-2">
              {section.gaps.map((g) => (
                <li key={g} className="flex gap-2.5 text-[14px] leading-relaxed text-tulivo-ink">
                  <span className="mt-[8px] h-1.5 w-1.5 flex-none rounded-full bg-tulivo-red" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tulivo-muted">
          Recommended actions
        </p>
        <ol className="mt-2.5 space-y-4">
          {section.fixes.slice(0, 3).map((fix, i) => (
            <li key={fix.action} className="rounded-[4px] border border-tulivo-line bg-tulivo-section/40 p-4">
              <div className="flex items-center gap-2">
                <span className="tabular text-[11px] font-semibold text-tulivo-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="rounded-full bg-tulivo-card px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.12em] text-tulivo-muted">
                  {fix.effort === "quick" ? "Quick win" : "Project"}
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-tulivo-ink">{fix.action}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-tulivo-muted">{fix.impact}</p>
            </li>
          ))}
          {section.fixes.length === 0 && (
            <li className="text-[14px] leading-relaxed text-tulivo-muted">
              Nothing urgent here - keep doing what you&apos;re doing and revisit in 90 days.
            </li>
          )}
        </ol>
        <div className="mt-6 rounded-[4px] border border-tulivo-line bg-tulivo-card p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-tulivo-muted">
            How you&apos;ll know it&apos;s working
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-tulivo-ink">
            Track the following data: {lowerFirst(section.measure.what)}
          </p>
          <div className="mt-4 space-y-3 border-t border-tulivo-hairline pt-4">
            <div>
              <p className="text-[13px] font-medium text-tulivo-head">Where to get it</p>
              <p className="mt-1 text-[14px] leading-relaxed text-tulivo-muted">
                {section.measure.where}
              </p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-tulivo-head">How often to check</p>
              <p className="mt-1 text-[14px] leading-relaxed text-tulivo-muted">
                {section.measure.cadence}
              </p>
            </div>
          </div>
        </div>

        {/* What an automated version of this stage would do. No price. */}
        <div className="mt-5 rounded-[4px] bg-tulivo-navy p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-tulivo-lilac">
            The next level · Built with you
          </p>
          <p className="mt-3 text-[15.5px] leading-[1.65] text-tulivo-on-navy">
            {section.nextLevel}
          </p>
        </div>

        <ToolTiers section={section} />
      </div>
    </div>
  );
}

/* Three tiers: what to start with, what is on the market, and how it joins up.
   The list itself is edited in content/tools.json, not here. */
function ToolTiers({ section }: { section: SectionResult }) {
  const tools = toolsFor(section.id);
  return (
    <div className="mt-5 rounded-[4px] bg-tulivo-section/60 p-5 sm:p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-tulivo-muted">
        Tools
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[14px] font-medium text-tulivo-head">Start here</p>
          <ul className="mt-2.5 space-y-2">
            {tools.startHere.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-tulivo-ink">
                <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-tulivo-purple" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[14px] font-medium text-tulivo-head">Tools on the market</p>
          <ul className="mt-2.5 space-y-2.5">
            {tools.market.map((tool) => (
              <li key={tool.name} className="text-[15px] leading-snug text-tulivo-ink">
                <span className="font-medium">{tool.name}</span>
                <span className="mt-0.5 block text-[13.5px] text-tulivo-muted">{tool.what}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 border-t border-tulivo-line pt-4">
        <p className="text-[14px] font-medium text-tulivo-head">The joined-up version</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-tulivo-muted">{tools.joinedUp}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-tulivo-muted">
          If you&apos;d like help putting it in place, email{" "}
          <a
            href={`mailto:${DIAGNOSTIC.contactEmail}`}
            className="font-medium text-tulivo-head underline underline-offset-4"
          >
            {DIAGNOSTIC.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}

/* "Every enquiry you receive..." reads wrong after a colon, so the sentence
   is lowered into the lead-in rather than written twice in the data. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function CheckMark() {
  return (
    <svg viewBox="0 0 16 16" className="mt-[5px] h-4 w-4 flex-none" aria-hidden>
      <path
        d="M3 8.4l3.2 3.2L13 4.6"
        fill="none"
        stroke="rgb(var(--t-purple))"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { LockIcon };
