"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BUSINESS_TYPES, SECTIONS } from "@/lib/diagnostic/sections";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencyFor,
} from "@/lib/diagnostic/currency";
import type { Profile } from "@/lib/diagnostic/types";
import { Button, Card, Eyebrow, Field, Wordmark, inputClass } from "./ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
  A worked example, not a benchmark. Every step is arithmetic the reader can
  check. No single one looks alarming, which is exactly why the losses are so
  easy to miss.
*/
const LADDER = [
  {
    n: 100,
    label: "people ask about you",
    note: "A month of marketing doing its job",
  },
  {
    n: 75,
    label: "get a reply while they still care",
    note: "3 in 4 answered in time",
  },
  {
    n: 45,
    label: "get as far as booking",
    note: "3 in 5 of those get through",
  },
  { n: 38, label: "turn up", note: "Around 1 in 7 drops out" },
  {
    n: 11,
    label: "come back again that year",
    note: "Fewer than 1 in 3 rebook",
  },
];

/*
  Four findings, each from a named survey or audit published in the last two
  years. The number carries the point; the line under it says why it matters.
*/
const EVIDENCE = [
  {
    stat: "75%",
    unit: "decide in under 30 minutes",
    body: "More than 1 in 4 decide in under five minutes. Most people look at three businesses or fewer. Reply tomorrow and the job has already gone.",
    source: "BrightLocal, Consumer Search Behavior, 2026",
  },
  {
    stat: "71%",
    unit: "gave up on booking",
    body: "That is regular clients, not strangers. It was too hard to reach someone or book online, so they left. They did not complain. They just went somewhere else.",
    source: "Zenoti, Salon and Spa Consumer Survey, 2025",
  },
  {
    stat: "1 in 3",
    unit: "no-shows stopped by one text",
    body: "Missed appointments fell from 7.5% to 5.0% after one text the day before. A no-show is a client you already paid for, in time you cannot sell twice.",
    source: "Chong & Jawad, closed loop audit, 2025",
  },
  {
    stat: "97%",
    unit: "read your reviews first",
    body: "More than two thirds will only use a business rated 4 stars or better. People read your reviews before they ever see your website.",
    source: "BrightLocal, Local Consumer Review Survey, 2026",
  },
];

const FREE = [
  "Your score out of 100",
  "All eight stages scored, so you can see the weak ones at a glance",
  "Your three biggest leaks, named in plain words",
  "What those leaks cost you in a year, in money",
];

const PAID = [
  "Every stage written up: what works, what leaks, what to do",
  "Advice built from your answers, not a template with your name on it",
  "The one number to move in 90 days, and the 3 or 4 jobs that move it",
  "How to track each one, using numbers you can already get",
  "Quick wins you can turn on this week for nothing",
  `A ${DIAGNOSTIC.reportPages}-page PDF to keep and work from`,
];

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function WelcomeScreen({
  initial,
  onStart,
}: {
  initial: Profile | null;
  onStart: (profile: Profile) => void;
}) {
  const [profile, setProfile] = useState<Profile>(
    initial ?? {
      name: "",
      email: "",
      business: "",
      businessType: "",
      website: "",
      currency: DEFAULT_CURRENCY.code,
    },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>(
    {},
  );
  const formRef = useRef<HTMLDivElement | null>(null);

  /*
    A client link verifies after this screen has already rendered, so the
    details it carries arrive late. Fill in the blanks when they do, without
    overwriting anything already typed.
  */
  useEffect(() => {
    if (!initial) return;
    setProfile((current) => ({
      name: current.name || initial.name || "",
      email: current.email || initial.email || "",
      business: current.business || initial.business || "",
      businessType: current.businessType || initial.businessType || "",
      website: current.website || initial.website || "",
      currency: current.currency || initial.currency || DEFAULT_CURRENCY.code,
    }));
  }, [initial]);

  function set(key: keyof Profile, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof Profile, string>> = {};
    if (!profile.name.trim()) next.name = "Please add your name";
    if (!EMAIL.test(profile.email.trim()))
      next.email = "Please add a valid email address";
    if (!profile.business.trim())
      next.business = "Please add your business name";
    if (!profile.businessType)
      next.businessType = "Please choose the closest match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onStart({
      name: profile.name.trim(),
      email: profile.email.trim(),
      business: profile.business.trim(),
      businessType: profile.businessType,
      website: profile.website?.trim() || undefined,
      currency: currencyFor(profile.currency).code,
    });
  }

  // The ad-budget example uses whatever currency they have picked.
  const symbol = currencyFor(profile.currency).symbol;

  function toForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:px-8 sm:py-16">
      <Wordmark />

      {/* Hero */}
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Eyebrow>For service business owners</Eyebrow>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-tulivo-ink sm:text-[52px]">
            Customer Journey
            <br />
            Diagnostic
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-tulivo-muted sm:text-[19px]">
            See where your business loses enquiries. See what each gap costs you
            in a year. See which one to fix first.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-tulivo-faint">
            <span>10-15 minutes</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>{SECTIONS.length} stages checked</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>Score and cost, free</span>
          </div>

          <div className="mt-10 border-l border-tulivo-line pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-faint">
              What you walk away with
            </p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-tulivo-muted">
              <li>
                <span className="font-medium text-tulivo-ink">
                  A score for all eight stages
                </span>{" "}
                between someone asking about you and coming back again.
              </li>
              <li>
                <span className="font-medium text-tulivo-ink">
                  A cost for every gap
                </span>
                , worked out from your own appointment numbers.
              </li>
              <li>
                <span className="font-medium text-tulivo-ink">
                  One number to move in 90 days
                </span>
                , and the 3 or 4 jobs that move it.
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="p-6 sm:p-8">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-tulivo-ink">
              Let&apos;s start with you
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-tulivo-muted">
              So your results and report are written for your business, not a
              generic one.
            </p>

            <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
              <Field label="Your name" error={errors.name}>
                <input
                  className={inputClass}
                  value={profile.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="name"
                  placeholder="Jane Smith"
                />
              </Field>

              <Field
                label="Email address"
                error={errors.email}
                hint="Your results are sent here."
              >
                <input
                  className={inputClass}
                  value={profile.email}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="jane@yourbusiness.co.uk"
                />
              </Field>

              <Field label="Business name" error={errors.business}>
                <input
                  className={inputClass}
                  value={profile.business}
                  onChange={(e) => set("business", e.target.value)}
                  autoComplete="organization"
                  placeholder="The Glow Room"
                />
              </Field>

              <Field label="Business type" error={errors.businessType}>
                <select
                  className={`${inputClass} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%236a6058' stroke-width='1.5'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
                  }}
                  value={profile.businessType}
                  onChange={(e) => set("businessType", e.target.value)}
                >
                  <option value="">Select the closest match…</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Your currency"
                hint="Every money figure in your results uses this."
              >
                <select
                  className={`${inputClass} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%236a6058' stroke-width='1.5'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
                  }}
                  value={profile.currency ?? DEFAULT_CURRENCY.code}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Website (optional)"
                hint="Add it and we'll look at your site alongside your answers."
              >
                <input
                  className={inputClass}
                  value={profile.website ?? ""}
                  onChange={(e) => set("website", e.target.value)}
                  inputMode="url"
                  autoComplete="url"
                  placeholder="www.yourbusiness.co.uk"
                />
              </Field>

              <Button type="submit" full className="mt-2">
                Start your diagnostic
              </Button>

              <p className="text-center text-[12px] leading-relaxed text-tulivo-faint">
                Your answers are saved as you go, so you can finish later on the
                same device.
              </p>
            </form>
          </Card>
        </motion.div>
      </div>

      {/* Why the journey matters */}
      <section className="mt-24 border-t border-tulivo-line pt-16 sm:mt-32">
        <Reveal>
          <Eyebrow>Before you spend more on ads</Eyebrow>
          <h2 className="mt-5 max-w-[20ch] text-[30px] font-semibold leading-[1.12] tracking-[-0.028em] text-tulivo-ink sm:text-[42px]">
            Fix the journey first. Then the ads are worth paying for.
          </h2>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal delay={0.05}>
            <p className="text-[17px] leading-[1.65] text-tulivo-ink sm:text-[18px]">
              Ads change one thing. They change how many people ask about you.
            </p>
            <p className="mt-4 text-[17px] leading-[1.65] text-tulivo-ink sm:text-[18px]">
              What happens next decides how many of them become clients. How
              fast you reply. How easy you are to book. Whether anything reminds
              them. Whether anyone asks them back.
            </p>
            <p className="mt-4 text-[17px] leading-[1.65] text-tulivo-muted sm:text-[18px]">
              If people slip away along the way, more ads just means more people
              slipping away. You pay twice. Once for the ad. Again for the
              client you never got.
            </p>
            <p className="mt-4 text-[17px] leading-[1.65] text-tulivo-muted sm:text-[18px]">
              And it is never one big problem. It is eight small ones, and they
              stack up. Hold on to three out of four people at each step and
              that sounds fine. Do it four steps in a row and most of the
              interest you paid for has gone.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
                Out of every 100 enquiries
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-tulivo-muted">
                An example, not your numbers. Nothing here looks like a
                disaster. That is the problem.
              </p>

              <ul className="mt-7 space-y-4">
                {LADDER.map((step, i) => (
                  <li key={step.label} className="flex items-baseline gap-4">
                    <span
                      className="w-[3rem] shrink-0 text-right text-[26px] font-semibold tabular-nums leading-none tracking-[-0.03em] text-tulivo-ink"
                      style={{ opacity: 1 - i * 0.1 }}
                    >
                      {step.n}
                    </span>
                    <span className="flex-1 text-[15px] leading-snug text-tulivo-ink">
                      {step.label}
                      <span className="mt-0.5 block text-[12px] text-tulivo-faint">
                        {step.note}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 rounded-[16px] bg-tulivo-clay-soft p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
                  Now fix one step
                </p>
                <p className="mt-3 text-[15px] leading-[1.6] text-tulivo-ink">
                  Reply to 90 of the 100 instead of 75. Every number under it
                  moves too. 54 bookings, not 45. 46 people through the door,
                  not 38. 14 who come back, not 11.
                </p>
                <p className="mt-3 text-[15px] font-medium leading-[1.6] text-tulivo-ink">
                  That is a fifth more clients from the same enquiries,
                  without spending a penny more on ads.
                </p>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* The ad-budget arithmetic */}
        <Reveal delay={0.05}>
          <Card className="mt-10 bg-tulivo-veil p-7 sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
              What this means for your ad budget
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[16px] leading-[1.7] text-tulivo-ink sm:text-[17px]">
                  Say each enquiry costs you {symbol}25, and one in five becomes
                  a client. So {symbol}1,000 buys 40 enquiries and 8 clients.
                </p>
                <p className="mt-3 text-[16px] leading-[1.7] text-tulivo-ink sm:text-[17px]">
                  Now make it one in three. The same {symbol}1,000 buys 12.
                </p>
              </div>
              <div className="rounded-[16px] bg-tulivo-card p-5">
                <p className="text-[15px] leading-[1.6] text-tulivo-muted">
                  To get those 4 extra clients from ads alone, you would spend
                </p>
                <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.03em] text-tulivo-clay">
                  {symbol}500 more a month
                </p>
                <p className="mt-2 text-[15px] leading-[1.6] text-tulivo-muted">
                  every month, for as long as you keep advertising. Fixing the
                  journey is a one-off.
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* Evidence */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>What the research says</Eyebrow>
          <h2 className="mt-5 max-w-[24ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[34px]">
            Four numbers worth knowing before you spend anything
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {EVIDENCE.map((item, i) => (
            <Reveal key={item.stat} delay={0.04 * i}>
              <Card className="flex h-full flex-col bg-tulivo-veil p-7">
                <p className="text-[56px] font-semibold leading-[0.9] tracking-[-0.04em] text-tulivo-clay sm:text-[64px]">
                  {item.stat}
                </p>
                <p className="mt-3 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-tulivo-ink">
                  {item.unit}
                </p>
                <p className="mt-3 flex-1 text-[15px] leading-[1.6] text-tulivo-muted">
                  {item.body}
                </p>
                <p className="mt-5 border-t border-tulivo-line pt-3 text-[12px] text-tulivo-faint">
                  {item.source}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The eight stages */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>What gets checked</Eyebrow>
          <h2 className="mt-5 max-w-[26ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[34px]">
            Eight stages, from the first search to the second booking
          </h2>
          <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.65] text-tulivo-muted">
            Each stage is scored on its own, because they break on their own.
            You will see which ones hold, which ones leak, and which one costs
            you the most.
          </p>
        </Reveal>

        <ol className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {SECTIONS.map((section, i) => (
            <motion.li
              key={section.id}
              className="relative border-l border-tulivo-line pl-6"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.55,
                delay: 0.03 * i,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="absolute -left-[9px] top-[3px] flex h-[18px] w-[18px] items-center justify-center rounded-full border border-tulivo-line bg-tulivo-card text-[10px] font-semibold text-tulivo-faint">
                {i + 1}
              </span>
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-tulivo-ink">
                {section.title}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-tulivo-muted">
                {section.why}
              </p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* What you get */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>What you get at the end</Eyebrow>
          <h2 className="mt-5 max-w-[24ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[34px]">
            Your gaps priced, not just described
          </h2>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="mt-9 p-7 sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
              The number you will see
            </p>
            <p className="mt-4 max-w-[64ch] text-[17px] leading-[1.7] text-tulivo-ink sm:text-[18px]">
              Near the end we ask two things. How many appointments do you do in
              a normal week? What is one worth on average?
            </p>
            <p className="mt-4 max-w-[64ch] text-[17px] leading-[1.7] text-tulivo-ink sm:text-[18px]">
              From that, every gap gets a price. Not &ldquo;this is costing
              you&rdquo;, but a figure for each stage and a total for the year,
              in your currency.
            </p>
            <p className="mt-4 max-w-[64ch] text-[16px] leading-[1.7] text-tulivo-muted">
              We keep it low on purpose. Each gap is capped, and the total is
              held to a small share of your revenue. A number you do not believe
              is no use to you. You see it before you pay for anything.
            </p>
          </Card>
        </Reveal>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <Card className="h-full bg-tulivo-veil p-7">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[17px] font-semibold tracking-[-0.02em] text-tulivo-ink">
                  Free, as soon as you finish
                </p>
                <p className="text-[13px] font-medium text-tulivo-faint">
                  No card needed
                </p>
              </div>
              <ul className="mt-5 space-y-3">
                {FREE.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-[15px] leading-relaxed text-tulivo-muted"
                  >
                    <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full bg-tulivo-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="h-full border-tulivo-clay/30 p-7">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[17px] font-semibold tracking-[-0.02em] text-tulivo-ink">
                  The full report
                </p>
                <p className="text-[13px] font-medium text-tulivo-clay">
                  From {DIAGNOSTIC.currencySymbol}
                  {DIAGNOSTIC.tiers[0].price}
                </p>
              </div>
              <ul className="mt-5 space-y-3">
                {PAID.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-[15px] leading-relaxed text-tulivo-muted"
                  >
                    <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full bg-tulivo-clay" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Closing */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Card className="p-8 text-center sm:p-12">
            <h2 className="mx-auto max-w-[26ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[34px]">
              The cheapest clients you will ever win are already in your inbox
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-[1.65] text-tulivo-muted">
              Every week these gaps stay open, you pay for them twice. Once to
              get the enquiry. Again when that person quietly books somewhere
              else.
            </p>
            <p className="mx-auto mt-3 max-w-[52ch] text-[17px] leading-[1.65] text-tulivo-ink">
              Fifteen minutes will tell you exactly where.
            </p>
            <Button className="mt-8" onClick={toForm}>
              Start your diagnostic
            </Button>
            <p className="mt-4 text-[13px] text-tulivo-faint">
              Your score and your cost estimate are free.
            </p>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
