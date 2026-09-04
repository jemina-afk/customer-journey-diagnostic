"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BUSINESS_TYPES, SECTIONS } from "@/lib/diagnostic/sections";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import type { Profile } from "@/lib/diagnostic/types";
import { Button, Card, Eyebrow, Field, Wordmark, inputClass } from "./ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
  A worked example rather than a benchmark. Every figure below is arithmetic the
  reader can check, which is the whole point: no single step looks alarming, and
  the damage only appears once you multiply them.
*/
const LADDER = [
  {
    label: "people enquire",
    now: 100,
    note: "A month of marketing doing its job",
  },
  {
    label: "get a reply while they still care",
    now: 75,
    note: "75% get an answer in time",
  },
  {
    label: "reach a booking they can complete",
    now: 45,
    note: "60% of those get through",
  },
  { label: "actually turn up", now: 38, note: "85% arrive" },
  { label: "come back within the year", now: 11, note: "30% rebook" },
];

/* Findings that sit behind the eight stages. Same sources as the report. */
const EVIDENCE = [
  {
    stat: "23%",
    title: "Speed decides the sale",
    body: "of firms never replied to an enquiry at all, in an audit of 2,241 companies. Those who replied within an hour were seven times more likely to qualify the lead than those who took an hour longer.",
  },
  {
    stat: "21x",
    title: "The first five minutes",
    body: "more likely to qualify a lead when you make contact within five minutes rather than thirty. Not a better script - the same script, sooner.",
  },
  {
    stat: "41%",
    title: "The diary you actually work",
    body: "average reduction in missed appointments where reminders are used, across a systematic review. A no-show is a client you already paid to win, in time you cannot resell.",
  },
  {
    stat: "5-25x",
    title: "Keeping beats winning",
    body: "the cost of winning a new client compared with keeping one. Cutting client defections by 5% lifted profits by 25-85% in the businesses studied.",
  },
];

const FREE = [
  "Your overall journey score out of 100",
  "All eight stages scored and colour-coded, so the weak ones are obvious",
  "Your three biggest leaks named in plain language",
  "An estimate, in pounds, of what those gaps are costing you over a year",
];

const PAID = [
  "Every stage written up: what's working, what's leaking and what to do about it",
  "Recommendations built from your answers, not a template with your name on it",
  "Your 90-day focus KPI and the three or four priorities aligned to it",
  "How to measure each one, using numbers you can already get at",
  "Quick wins you can switch on this week without buying anything",
  `The ${DIAGNOSTIC.reportPages}-page PDF report to keep and work from`,
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
          <Eyebrow>For wellness &amp; beauty business owners</Eyebrow>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-tulivo-ink sm:text-[52px]">
            Customer Journey
            <br />
            Diagnostic
          </h1>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-tulivo-muted sm:text-[19px]">
            Find out exactly where your business is losing enquiries, what each
            gap is costing you over a year, and which one to fix first.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-tulivo-faint">
            <span>10-15 minutes</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>{SECTIONS.length} stages assessed</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>Score and cost estimate, free</span>
          </div>

          <div className="mt-10 border-l border-tulivo-line pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-faint">
              What you leave with
            </p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-tulivo-muted">
              <li>
                <span className="font-medium text-tulivo-ink">
                  A score for each of the eight stages
                </span>{" "}
                between an enquiry arriving and a client coming back.
              </li>
              <li>
                <span className="font-medium text-tulivo-ink">
                  A figure in pounds
                </span>{" "}
                against every gap, worked out from your own appointment numbers.
              </li>
              <li>
                <span className="font-medium text-tulivo-ink">
                  One number to move over 90 days
                </span>
                , with the three or four priorities that move it.
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
                label="Website (optional)"
                hint="Share the link and we'll look at your site alongside your answers."
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
          <Eyebrow>Before you spend another pound on ads</Eyebrow>
          <h2 className="mt-5 max-w-[20ch] text-[30px] font-semibold leading-[1.12] tracking-[-0.028em] text-tulivo-ink sm:text-[40px]">
            Your journey decides what your marketing is worth
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal delay={0.05}>
            <p className="text-[16px] leading-relaxed text-tulivo-ink sm:text-[17px]">
              Most wellness and beauty businesses do not have a marketing
              problem. They have a journey problem. Advertising changes how many
              people arrive. What happens next - how quickly you reply, how easy
              you are to book, whether anything reminds them, whether anyone
              ever asks them back - decides how many of those people become
              clients. Spend more without fixing that and you buy the same
              losses at a larger scale.
            </p>
            <p className="mt-5 text-[16px] leading-relaxed text-tulivo-muted sm:text-[17px]">
              The journey is not one moment, it is eight of them, and they
              multiply rather than add up. A stage that holds on to three
              quarters of people looks perfectly respectable on its own. Put
              four of those in a row and most of the interest you paid to create
              has quietly gone elsewhere. That is why the losses are so hard to
              spot from the inside: nothing is broken, everything is simply a
              bit leaky.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
                A worked example
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-tulivo-muted">
                Out of every 100 enquiries, using percentages you can argue
                with. The point is not the numbers, it is what happens when you
                multiply them.
              </p>

              <ul className="mt-6 space-y-3">
                {LADDER.map((step, i) => (
                  <li key={step.label} className="flex items-baseline gap-4">
                    <span
                      className="w-[2.6rem] shrink-0 text-right text-[19px] font-semibold tabular-nums tracking-[-0.02em] text-tulivo-ink"
                      style={{ opacity: 1 - i * 0.11 }}
                    >
                      {step.now}
                    </span>
                    <span className="flex-1 text-[14px] leading-snug text-tulivo-muted">
                      {step.label}
                      <span className="block text-[12px] text-tulivo-faint">
                        {step.note}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-[16px] bg-tulivo-clay-soft p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
                  Now fix one stage
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-tulivo-ink">
                  Reply to 90 of those 100 instead of 75 and every number below
                  it moves with you: 54 bookings instead of 45, 46 people
                  through the door instead of 38, 14 who come back instead of
                  11. A fifth more clients from exactly the same enquiries, and
                  not one extra pound of ad spend.
                </p>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* The ad-budget arithmetic */}
        <Reveal delay={0.05}>
          <Card className="mt-10 bg-tulivo-veil p-7 sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
              What this means for an ad budget
            </p>
            <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-tulivo-ink sm:text-[17px]">
              Say enquiries cost you £25 and one in five becomes a client. A
              £1,000 month buys 40 enquiries and 8 clients. Lift that to one in
              three and the same £1,000 buys 12. To win those four extra clients
              through advertising alone you would have to spend £500 more every
              single month, for as long as you keep advertising. Fixing the
              journey costs you once.
            </p>
          </Card>
        </Reveal>
      </section>

      {/* Evidence */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>Why these eight stages</Eyebrow>
          <h2 className="mt-5 max-w-[24ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[32px]">
            The gaps with the strongest evidence behind them
          </h2>
        </Reveal>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {EVIDENCE.map((item, i) => (
            <Reveal key={item.title} delay={0.04 * i}>
              <Card className="h-full bg-tulivo-veil p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tulivo-muted">
                  {item.title}
                </p>
                <p className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.03em] text-tulivo-clay">
                  {item.stat}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-tulivo-muted">
                  {item.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-6 max-w-[80ch] text-[12px] leading-relaxed text-tulivo-faint">
            Sources: The Short Life of Online Sales Leads, Harvard Business
            Review (2011). Lead Response Management study, MIT Sloan /
            InsideSales (2007). Opon et al., The effect of patient reminders in
            reducing missed appointments in medical settings: a systematic
            review, PAMJ One Health (2020). Zero Defections: Quality Comes to
            Services, Harvard Business Review (1990).
          </p>
        </Reveal>
      </section>

      {/* The eight stages */}
      <section className="mt-24 sm:mt-28">
        <Reveal>
          <Eyebrow>What gets assessed</Eyebrow>
          <h2 className="mt-5 max-w-[26ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[32px]">
            Eight stages, from the first search to the second booking
          </h2>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-tulivo-muted">
            Each one is scored separately, because they fail separately. You
            will see which are holding, which are leaking, and which single
            stage is costing you the most.
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
          <h2 className="mt-5 max-w-[24ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[32px]">
            Your gaps priced, not just described
          </h2>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="mt-9 p-7 sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tulivo-clay">
              The number you will see
            </p>
            <p className="mt-4 max-w-[70ch] text-[16px] leading-relaxed text-tulivo-ink sm:text-[17px]">
              Two questions near the end ask how many appointments you do in a
              typical week and what an average one is worth. From those, every
              gap you have is given a figure: not a vague &ldquo;this is costing
              you&rdquo;, but a number per stage and a total for the year. It is
              worked out deliberately conservatively - each individual leak is
              capped, and the total is held to a fraction of your revenue -
              because a figure you do not believe is no use to you. You see that
              estimate before you pay for anything.
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
                    className="flex gap-3 text-[14px] leading-relaxed text-tulivo-muted"
                  >
                    <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-tulivo-gold" />
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
                    className="flex gap-3 text-[14px] leading-relaxed text-tulivo-muted"
                  >
                    <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-tulivo-clay" />
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
            <h2 className="mx-auto max-w-[26ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-tulivo-ink sm:text-[32px]">
              The cheapest clients you will ever win are already in your inbox
            </h2>
            <p className="mx-auto mt-5 max-w-[56ch] text-[16px] leading-relaxed text-tulivo-muted">
              Every week these gaps stay open you pay for them twice: once to
              create the enquiry, and again when that person quietly books
              somewhere else. Fifteen minutes will tell you exactly where.
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
