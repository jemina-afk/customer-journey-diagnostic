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
import { JourneyFunnel } from "../journey/JourneyFunnel";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
  The one finding worth the space. The diagnostic itself covers the rest; this
  is here to explain why speed is the thing people underestimate.
*/
const EVIDENCE = {
  stat: "75%",
  unit: "decide in under 30 minutes",
  body: "More than 1 in 4 decide in under five minutes. Most people look at three businesses or fewer. Reply tomorrow and the job has already gone.",
  source: "BrightLocal, Consumer Search Behavior, 2026",
};

/*
  The eight stages as the page describes them. The diagnostic's own wording
  lives in sections.ts and is not touched by this file; these are the short
  lines that introduce each stage to someone who has not started yet.
*/
const STAGES = [
  {
    title: "Lead sources and discovery",
    line: "Where new clients first hear about you, and how many places that is.",
  },
  {
    title: "Lead response",
    line: "How quickly an enquiry hears back, while they're still deciding.",
  },
  {
    title: "Lead nurture and follow-up",
    line: "What happens when someone isn't ready to book straight away.",
  },
  {
    title: "Booking process",
    line: "How many steps sit between “I want this” and “it's in the diary”.",
  },
  {
    title: "Confirmation and pre-appointment",
    line: "What people receive between booking and arriving.",
  },
  {
    title: "Reminders and no-show prevention",
    line: "How you make sure booked clients actually turn up.",
  },
  {
    title: "Reviews and reputation",
    line: "How happy clients tell the next person who's looking.",
  },
  {
    title: "Retention and re-engagement",
    line: "How past clients are invited back, and how often they return.",
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
  "Quick wins you can switch on this week",
  `A ${DIAGNOSTIC.reportPages}-page PDF to keep and work from`,
];

/*
  TODO (Jemina): replace with the client's own words and their real details.
  Nothing here is invented copy - it is a visible placeholder on purpose, so
  the page cannot go live with a testimonial nobody said.
*/
const TESTIMONIAL = {
  quote: "[paste the client's exact words]",
  name: "[Name]",
  business: "[business]",
  location: "[location]",
};

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
          <h1 className="mt-6 text-[40px] font-medium leading-[1.02] tracking-[-0.045em] text-tulivo-head sm:text-[60px]">
            Customer Journey
            <br />
            Diagnostic
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-tulivo-muted sm:text-[19px]">
            See where your business is losing enquiries, what each gap is
            costing you over a year, and which one to fix first.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-tulivo-faint">
            <span>10-15 minutes</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>{SECTIONS.length} stages checked</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>Score and cost, free</span>
          </div>

          <div className="mt-10 border-l border-tulivo-line pl-6">
            <p className="text-[14px] leading-[1.3] text-tulivo-faint">
              What you walk away with
            </p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-tulivo-muted">
              <li>
                <span className="font-medium text-tulivo-head">
                  A score for all eight stages
                </span>{" "}
                between someone asking about you and coming back again.
              </li>
              <li>
                <span className="font-medium text-tulivo-head">
                  A cost for every gap
                </span>
                , worked out from your own appointment numbers.
              </li>
              <li>
                <span className="font-medium text-tulivo-head">
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
            <h2 className="text-[26px] font-medium leading-[1.15] tracking-[-0.035em] text-tulivo-head">
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


      {/* Watch it happen */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>What it looks like</Eyebrow>
          <h2 className="mt-6 max-w-[22ch] text-[32px] font-medium leading-[1.06] tracking-[-0.04em] text-tulivo-head sm:text-[44px]">
            Twenty-four people, and where they go
          </h2>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-[1.65] text-tulivo-muted">
            Nobody storms off. They just quietly stop, one stage at a time, and
            you never find out which stage it was. Here is the same twenty-four
            people walking the journey twice, once with the gaps open and once
            with them closed.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[4px] border border-tulivo-line">
              <div className="aspect-[4/5]">
                <JourneyFunnel variant="leaking" theme="light" />
              </div>
            </div>
            <div className="overflow-hidden rounded-[4px]">
              <div className="aspect-[4/5]">
                <JourneyFunnel variant="fixed" theme="navy" />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-5 max-w-[66ch] text-[14px] leading-relaxed text-tulivo-faint">
            Illustrative numbers, not a benchmark. The point is the shape: eight
            small losses, none of them alarming on their own, and only a
            handful of people left at the end.
          </p>
        </Reveal>
      </section>

      {/* The one number worth knowing before you start */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <div className="rounded-[4px] bg-tulivo-navy p-7 sm:p-10">
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-10">
              <p className="text-[64px] font-medium leading-[0.92] tracking-[-0.045em] text-tulivo-lilac sm:text-[86px]">
                {EVIDENCE.stat}
              </p>
              <div>
                <p className="text-[24px] font-medium leading-[1.15] tracking-[-0.035em] text-tulivo-on-navy sm:text-[30px]">
                  {EVIDENCE.unit}
                </p>
                <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.6] text-tulivo-on-navy/75">
                  {EVIDENCE.body}
                </p>
                <p className="mt-6 border-t border-white/10 pt-4 text-[13px] text-tulivo-muted-navy">
                  {EVIDENCE.source}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* The eight stages */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>What gets checked</Eyebrow>
          <h2 className="mt-6 max-w-[26ch] text-[32px] font-medium leading-[1.06] tracking-[-0.04em] text-tulivo-head sm:text-[44px]">
            Eight stages, from the first search to the second booking
          </h2>
          <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.65] text-tulivo-muted">
            Each stage is scored on its own, because they break on their own.
            You will see which ones hold, which ones leak, and which one costs
            you the most.
          </p>
        </Reveal>

        <ol className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {STAGES.map((stage, i) => (
            <motion.li
              key={stage.title}
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
              <span className="absolute -left-[9px] top-[3px] flex h-[18px] w-[18px] items-center justify-center rounded-full border border-tulivo-line bg-tulivo-card text-[10px] font-medium text-tulivo-faint">
                {i + 1}
              </span>
              <p className="text-[17px] font-medium leading-[1.25] tracking-[-0.035em] text-tulivo-head">
                {stage.title}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-tulivo-muted">
                {stage.line}
              </p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* What you get */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>What you get at the end</Eyebrow>
          <h2 className="mt-6 max-w-[24ch] text-[32px] font-medium leading-[1.06] tracking-[-0.04em] text-tulivo-head sm:text-[44px]">
            Your gaps priced, not just described
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <Card className="h-full bg-tulivo-section p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[24px] font-medium leading-[1.15] tracking-[-0.035em] text-tulivo-head">
                  Free, as soon as you finish
                </p>
                <p className="text-[14px] font-medium text-tulivo-faint">
                  No card needed
                </p>
              </div>
              <ul className="mt-5 space-y-3">
                {FREE.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-[15px] leading-relaxed text-tulivo-muted"
                  >
                    <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full bg-tulivo-purple" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="h-full border-tulivo-purple/30 p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[24px] font-medium leading-[1.15] tracking-[-0.035em] text-tulivo-head">
                  The full report
                </p>
                <p className="text-[18px] font-medium tracking-[-0.035em] text-tulivo-head">
                  {DIAGNOSTIC.currencySymbol}
                  {DIAGNOSTIC.tiers[0].price}
                </p>
              </div>
              <ul className="mt-5 space-y-3">
                {PAID.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-[15px] leading-relaxed text-tulivo-muted"
                  >
                    <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full bg-tulivo-purple" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-tulivo-line pt-5 text-[15px] leading-relaxed text-tulivo-muted">
                If you&rsquo;d like help putting it in place, the{" "}
                {DIAGNOSTIC.currencySymbol}
                {DIAGNOSTIC.tiers[0].price} comes off any system or partnership
                you book within 30 days.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* In someone else's words */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <div className="grid gap-10 rounded-[4px] bg-tulivo-section p-7 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div>
              <blockquote className="text-[24px] font-medium leading-[1.3] tracking-[-0.035em] text-tulivo-head sm:text-[30px]">
                &ldquo;{TESTIMONIAL.quote}&rdquo;
              </blockquote>
              <p className="mt-6 text-[15px] leading-relaxed text-tulivo-muted">
                {TESTIMONIAL.name}, {TESTIMONIAL.business},{" "}
                {TESTIMONIAL.location}
              </p>
            </div>

            <div className="border-t border-tulivo-line pt-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-1">
              <p className="text-[17px] leading-[1.65] text-tulivo-ink">
                I spent 10 years in client-facing roles with global
                organisations, looking after the renewals that kept
                multi-million pound accounts. This diagnostic uses the same
                thinking, scaled to your business.
              </p>
              <p className="mt-4 text-[15px] text-tulivo-muted">
                {DIAGNOSTIC.consultant}, {DIAGNOSTIC.company}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Closing */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <div className="tulivo-gradient rounded-[4px] p-8 text-center sm:p-14">
            <h2 className="mx-auto max-w-[26ch] text-[32px] font-medium leading-[1.06] tracking-[-0.04em] text-tulivo-on-navy sm:text-[44px]">
              The cheapest clients you will ever win are already in your inbox
            </h2>
            <p className="mx-auto mt-6 max-w-[54ch] text-[17px] leading-[1.7] text-tulivo-on-navy/80">
              Every week these gaps stay open, you lose clients you&rsquo;ve
              already done the hard work to win. Fifteen minutes will show you
              exactly where it&rsquo;s happening.
            </p>
            <Button className="mt-9" variant="onDark" onClick={toForm}>
              Start your diagnostic
            </Button>
            <p className="mt-4 text-[13px] text-tulivo-muted-navy">
              Your score and your cost estimate are free.
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
