# Customer Journey Diagnostic

An interactive assessment for wellness and beauty business owners — aesthetics
clinics, salons, spas, Pilates and fitness studios, therapists. It walks an
owner through all eight stages of their customer journey, scores each one,
shows where clients are being lost, and sells the full report with the fixes.

Built for **Tulivo Digital** (Jemina Semakula).

**Free:** overall score, radar chart, all eight stage scores with
red/amber/green status, and the names of the top three priorities.
**Paid (£297):** the recommendations, stage-by-stage analysis, quick wins, the
30/60/90 day action plan, and a 14-page PDF report.

## The flow

1. **Welcome** — name, email, business name, business type, and their website
   link (optional, so their site can be reviewed alongside their answers).
2. **Eight stages**, one screen each, five questions per stage — multi-select,
   single choice, sliders, 1–5 scales and free text. A pinned progress bar,
   live tick marks as questions are answered, and thumb-sized targets, because
   most people complete this on a phone between clients.
3. **Results** — score out of 100, band, radar chart, stage scores, priorities.
4. **Paywall** — the locked content is rendered for real and blurred, so it's
   visibly specific rather than a generic teaser.
5. **Unlocked** — full recommendations on screen, the PDF to download, and the
   same report emailed over.

Answers autosave to `localStorage` after every question, so a closed tab or a
dropped connection never costs someone their progress.

## The eight stages

| # | Stage | What it measures |
|---|-------|------------------|
| 1 | Lead Sources & Discovery | Whether people can find you at all |
| 2 | Lead Response | How fast enquiries get answered |
| 3 | Lead Nurture & Follow-Up | What happens when they don't book straight away |
| 4 | Booking Process | Friction between deciding and booking |
| 5 | Confirmation & Pre-Appointment | The gap between booking and arrival |
| 6 | Reminders & No-Show Prevention | Whether the diary you fill is the diary you work |
| 7 | Reviews & Reputation | The proof that makes everything else work |
| 8 | Retention & Re-engagement | Whether clients come back |

Questions are written to be answerable. Where an owner genuinely might not know
a number — their enquiry-to-client rate, their no-show rate — there's an
explicit **I don't know**, which scores below a measured answer and produces a
recommendation to start tracking it, rather than forcing a guess that would
distort the whole report. Booking friction is asked as a list of things that
actually happen ("they message to ask what availability you have") rather than
as a self-rating nobody can honestly give.

Stage 8 also asks **what one client is worth over their lifetime**. It doesn't
affect the score — it's context — but it turns the rest of the report into
pounds: *"At £150–£300 per client, one extra client a month is worth £2,700 a
year to you — the bar every recommendation here has to clear."*

## How scoring works

Every answer carries a score from 0 to 1 and a weight. A stage score is the
weighted average of its questions; the overall score weights the stages that
move money fastest — **Lead Response ×1.3**, **Reminders & No-Show Prevention
×1.25**, **Retention ×1.2** — above the rest.

| Overall | Band | Meaning |
|---------|------|---------|
| 80–100 | Optimised | Solid. Fine-tuning brings the next gains. |
| 60–79 | Functional | Core pieces in place, gaps are costing you. |
| 40–59 | Leaking | Significant gaps — losing clients you could win. |
| 0–39 | Critical | Major gaps; foundational fixes, fastest returns. |

Stage status is green at 75+, amber at 50–74, red below 50.

**Priorities are ranked by weighted headroom**, not by raw score — `(100 −
score) × stage weight` — so the top three are where the next hour of work buys
the most, which isn't always the three lowest numbers.

**Findings are written from the answers themselves.** In `sections.ts`, each
weak option carries its own gap and its own fix (an action, its impact, and
whether it's a quick win or a project); each strong option carries its own
strength. Nothing in a report is a template — it's assembled from what that
owner actually told us.

## The PDF report

Fourteen pages, drawn as vectors with jsPDF rather than captured from the
screen, so type stays sharp at any zoom and the file stays small enough to
email (~50 KB):

cover · executive summary · journey map with a vector radar · one page per
stage (what's working, gaps, recommendations, tools) · prioritised action plan
with quick wins and 30/60/90 · next steps and offers · about Tulivo.

It's generated in the browser, which keeps the server free of a rendering
runtime, then posted to the API as a data URI to be attached to the email.

## Payments, unlocking and email

Nothing here is required to run the app — each piece switches on when its
environment variable appears.

| Variables | What they enable |
|-----------|------------------|
| `STRIPE_SECRET_KEY`, `DIAGNOSTIC_PRICE_PENCE` | Stripe Checkout, created by direct API call (no SDK). On return, payment is **verified server-side** before anything unlocks. |
| `NEXT_PUBLIC_CHECKOUT_URL` | Stan Store or any external checkout, used when Stripe isn't configured. |
| `DIAGNOSTIC_UNLOCK_CODE` | A code you send after payment taken any other way; the client enters it on the results screen. |
| `RESEND_API_KEY`, `DIAGNOSTIC_FROM_EMAIL`, `DIAGNOSTIC_NOTIFY_EMAIL` | Emails the report (PDF attached) to the client, and a summary to you — once on completion, again on purchase. |
| `NEXT_PUBLIC_DIAGNOSTIC_PRICE`, `NEXT_PUBLIC_BOOKING_URL`, `NEXT_PUBLIC_CONTACT_EMAIL` | The price shown, your calendar link, your reply-to address. |
| `NEXT_PUBLIC_TEST_MODE_KEY` | Switches test mode on for the live site — see [Test mode](#test-mode). |

Scores are always recalculated on the server from the submitted answers rather
than trusted from the browser.

The lead email carries their name, business, type, **website link**, client
value band, overall score, every stage score and their three priorities — enough
to decide whether to follow up before you open anything else.

Leads arrive by email rather than being stored in a database. If you want a
stored history later, `src/lib/diagnostic/server.ts` is the one file to change.

## Test mode

A way to walk the entire flow — including the paid side — without paying or
answering forty questions.

Add `?test=` to the URL and a strip appears at the top with three controls:

- **Fill sample answers** — completes a whole run and drops you on the results.
  Press it again for a different set of scores.
- **Unlock without paying** — reveals the paid report, exactly as a client sees
  it, so you can check the recommendations, the PDF and the emails.
- **Reset** — clears everything and starts over.

Any email a test run sends is subject-prefixed `[TEST]`, so your inbox never
confuses one for a real lead.

**Where it works.** Local development and Vercel preview deployments have it on
already — `http://localhost:3000/?test=1`. On the live production site it stays
off unless you set `NEXT_PUBLIC_TEST_MODE_KEY` to a value only you know, and
then only `/?test=<that value>` switches it on. That way nobody unlocks a £297
report by guessing a query string.

## Running it

```bash
npm install
cp .env.example .env.local   # optional — fill in what you want switched on
npm run dev                  # http://localhost:3000
```

```bash
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Deploying

Import the repo in **Vercel** (it auto-detects Next.js), add whichever
environment variables you want from the table above under **Settings →
Environment Variables**, and deploy. Point a subdomain such as
`diagnostic.tulivodigital.com` at it under **Settings → Domains**.

Any Node host works — there's no database and no build-time secret.

## Layout

```
src/
  app/
    layout.tsx            root layout, Inter, warm wash
    page.tsx              the diagnostic
    globals.css           palette, slider styling, locked-content blur
    api/diagnostic/       submit · checkout · verify · unlock · email-report
  components/diagnostic/
    DiagnosticApp.tsx     stage machine, autosave, unlock and PDF flow
    WelcomeScreen.tsx     intake
    SectionScreen.tsx     one stage per screen
    questions.tsx         a control per question type
    ResultsScreen.tsx     free results, paywall, unlocked report
    RadarChart.tsx        hand-drawn SVG radar and score dial
    Locked.tsx            blurred content behind a lock
    ui.tsx                buttons, cards, fields, wordmark
  lib/diagnostic/
    sections.ts           the eight stages: questions, scoring, gaps, fixes
    scoring.ts            stage and overall scores, bands, priorities, plan
    pdf.ts                the 14-page report
    config.ts             price, links, offers
    server.ts             email and Stripe helpers
    storage.ts            localStorage autosave
    types.ts
```

## Editing the content

- **Questions, scoring, gaps and recommendations** — `src/lib/diagnostic/sections.ts`.
  Add an option with a `score`, a `gap` and a `fix` and it flows through to the
  results screen, the PDF and the emails automatically.
- **Price, calendar link, offers, contact details** — `src/lib/diagnostic/config.ts`.
- **Bands and weightings** — `src/lib/diagnostic/scoring.ts`.
- **Colours and type** — `tailwind.config.ts` and the palette at the top of
  `src/app/globals.css`.

British English throughout, and the tone is warm but straight: gaps are framed
as opportunities, never as failures.
