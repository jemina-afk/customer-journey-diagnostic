import type { Metadata } from "next";
import { DIAGNOSTIC } from "@/lib/diagnostic/config";
import { SECTIONS } from "@/lib/diagnostic/sections";
import { Button, Card, Eyebrow, Rule, Wordmark } from "@/components/diagnostic/ui";

export const metadata: Metadata = {
  title: "Book a call - Tulivo Digital",
  description:
    "A free 20-minute call for wellness and beauty business owners: where your enquiries are leaking, and the one number to fix first.",
};

/*
  The page ads point at. One job: book the call. Everything on it either builds
  the case for the conversation or gets out of the way of the calendar.
*/

/*
  Deliberately not statistics. Anything with a number in it on a page running
  paid traffic needs a source behind it, and these are truths about their own
  business rather than claims about the sector.
*/
const LEAKS = [
  {
    stat: "Every no-show",
    line: "was a client you already paid to win, in a slot you can no longer sell.",
  },
  {
    stat: "Every late reply",
    line: "is an enquiry someone else may have answered first. The first few minutes decide most of it.",
  },
  {
    stat: "Every client who drifts",
    line: "costs more to replace than they would have cost to keep.",
  },
];

const STEPS = [
  {
    title: "Before we speak",
    body: "You tell me your business type and roughly what a client is worth. Nothing to prepare.",
  },
  {
    title: "On the call",
    body: "We walk your customer journey stage by stage - how people find you, how fast you reply, what happens when they don't book, and what happens after they leave.",
  },
  {
    title: "You leave with",
    body: "The stage costing you most, a rough figure for what it's costing, and the two things to change first. Yours whether we work together or not.",
  },
];

export default function CallPage() {
  const booking = DIAGNOSTIC.bookingUrl;

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:px-8 sm:py-14">
      <Wordmark />

      <section className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <Eyebrow>For wellness &amp; beauty business owners</Eyebrow>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.03] tracking-[-0.03em] text-tulivo-ink sm:text-[52px]">
            You&apos;re not short of
            <br />
            enquiries. You&apos;re
            <br />
            losing them.
          </h1>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-tulivo-muted sm:text-[19px]">
            {DIAGNOSTIC.callMinutes} minutes, free, no pitch deck. We&apos;ll find the stage of your
            customer journey that&apos;s costing you most - and what it&apos;s worth to fix it.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-tulivo-faint">
            <span>{DIAGNOSTIC.callMinutes} minutes</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>No cost, no obligation</span>
            <span className="hidden h-1 w-1 rounded-full bg-tulivo-line sm:inline-block" />
            <span>{DIAGNOSTIC.consultant}</span>
          </div>

          <a href="#book" className="mt-9 inline-block">
            <Button className="px-9">Book your call</Button>
          </a>

          <div className="mt-12 space-y-5 border-l border-tulivo-line pl-6">
            {LEAKS.map((leak) => (
              <div key={leak.stat}>
                <span className="tabular text-[15px] font-semibold text-tulivo-clay">{leak.stat}</span>
                <p className="mt-1 max-w-[46ch] text-[15px] leading-relaxed text-tulivo-muted">{leak.line}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Card className="p-6 sm:p-8">
            <Eyebrow>What we cover</Eyebrow>
            <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-tulivo-ink">
              The eight stages a client passes through
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-tulivo-muted">
              Most businesses are strong at four or five of these and quietly losing people at the rest.
            </p>
            <ol className="mt-6 space-y-3.5">
              {SECTIONS.map((section, i) => (
                <li key={section.id} className="flex items-baseline gap-3.5 text-[15px] text-tulivo-ink">
                  <span className="tabular text-[11px] font-semibold text-tulivo-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title}</span>
                </li>
              ))}
            </ol>
            <Rule className="my-6" />
            <p className="text-[14px] leading-relaxed text-tulivo-muted">
              If it&apos;s useful afterwards, I&apos;ll offer you the full diagnostic - all eight stages
              scored, with a report and a 90-day plan. Only ever after we&apos;ve spoken.
            </p>
          </Card>
        </div>
      </section>

      <section className="mt-16">
        <Eyebrow>How it works</Eyebrow>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="p-6">
              <span className="tabular text-[11px] font-semibold uppercase tracking-[0.2em] text-tulivo-clay">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.02em] text-tulivo-ink">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-tulivo-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="book" className="mt-16 scroll-mt-8">
        <Card className="overflow-hidden">
          <div className="border-b border-tulivo-line bg-tulivo-veil/60 px-6 py-8 text-center sm:px-10">
            <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-tulivo-ink sm:text-[30px]">
              Pick a time that suits you
            </h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-tulivo-muted">
              Evenings and between-client slots included, because that&apos;s when most owners are free.
            </p>
          </div>
          <div className="bg-tulivo-card">
            <iframe
              src={booking}
              title="Book a call with Tulivo Digital"
              className="h-[760px] w-full border-0"
              loading="lazy"
            />
          </div>
          <div className="border-t border-tulivo-line px-6 py-5 text-center sm:px-10">
            <p className="text-[13.5px] leading-relaxed text-tulivo-muted">
              Calendar not loading?{" "}
              <a
                href={booking}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-tulivo-ink underline decoration-tulivo-clay/40 underline-offset-4 hover:decoration-tulivo-clay"
              >
                Open it in a new tab
              </a>{" "}
              or email{" "}
              <a href={`mailto:${DIAGNOSTIC.contactEmail}`} className="font-medium text-tulivo-ink underline decoration-tulivo-clay/40 underline-offset-4">
                {DIAGNOSTIC.contactEmail}
              </a>
              .
            </p>
          </div>
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
