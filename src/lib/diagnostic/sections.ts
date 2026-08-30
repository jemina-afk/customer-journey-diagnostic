import { UNKNOWN } from "./types";
import type { Answers, Question, Section } from "./types";

/*
  The eight stages of the customer journey, with the questions, scoring and the
  copy that turns an answer into a finding. Weak options carry the gap and the
  fix, strong options carry the strength - so every report is written from what
  the business owner actually told us, never from a template.
*/

/** Score a count against a ladder of thresholds, e.g. [0, 0.3, 0.55, 0.8, 1]. */
function ladder(count: number, steps: number[]): number {
  if (count <= 0) return steps[0];
  return steps[Math.min(count, steps.length - 1)];
}

/** Linear interpolation between labelled points, e.g. reviews -> score. */
function curve(value: number, points: [number, number][]): number {
  if (value <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (value <= x1) return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points[points.length - 1][1];
}


/** Reads an answer by `${sectionId}.${questionId}`. */
function answer(answers: Answers, key: string): string | string[] | number | undefined {
  return answers[key];
}

function num(answers: Answers, key: string): number | null {
  const value = answer(answers, key);
  return typeof value === "number" ? value : null;
}

function label(answers: Answers, sectionId: string, questionId: string): string | null {
  const value = answer(answers, `${sectionId}.${questionId}`);
  if (typeof value !== "string" || value === UNKNOWN) return null;
  const section = SECTIONS.find((s) => s.id === sectionId);
  const question = section?.questions.find((q) => q.id === questionId);
  if (!question || question.kind !== "choice") return null;
  return question.options.find((o) => o.value === value)?.label ?? null;
}

export const BUSINESS_TYPES = [
  "Aesthetics clinic",
  "Beauty salon",
  "Hair salon",
  "Spa or wellness centre",
  "Pilates or yoga studio",
  "Fitness or personal training",
  "Massage or bodywork",
  "Therapy or counselling",
  "Nails or lashes",
  "Nutrition or health coaching",
  "Other wellness or beauty business",
];

export const SECTIONS: Section[] = [
  {
    id: "lead-sources",
    title: "Lead Sources & Discovery",
    shortTitle: "Discovery",
    context: "Let's understand how potential clients find you.",
    why:
      "Discovery decides how many people ever get the chance to become clients. A business with one source is one algorithm change away from a very quiet month.",
    weight: 1,
    verdict: {
      strong:
        "You're findable. People looking for what you do can see you, trust you and reach you without hunting - which means the rest of your journey gets a healthy flow of enquiries to work with.",
      ok:
        "You're visible, but you're leaning on fewer channels than you should be. Broadening discovery is the difference between hoping for enquiries and expecting them.",
      weak:
        "Right now, being found relies on luck or word of mouth. There are people searching for exactly what you offer this week who won't come across you - that's the cheapest gap in your whole journey to close.",
    },
    tools: [
      "Google Business Profile (free - the highest-return hour you'll spend)",
      "A booking-first website page for each core service",
      "Local directory listings for your area and treatment type",
    ],
    purpose: "Be findable where clients are already looking",
    kpi: {
      name: "New enquiries a month",
      metric: "How many people reach out to you in a month, across every channel",
      why: "Everything downstream is capped by this number. Fixing conversion matters, but not if only a handful of people ever find you.",
      supports: ["lead-sources", "reviews", "booking"],
      current: (answers) => {
        const sources = answer(answers, "lead-sources.sources");
        if (!Array.isArray(sources) || sources.length === 0) return null;
        return `${sources.length} route${sources.length === 1 ? "" : "s"} in`;
      },
      target: () => "Three dependable routes, with Google as one of them",
      measure: {
        what: "Enquiries received, split by where each one came from.",
        where:
          "A one-line log per enquiry - date, source, did they book - plus your Google Business Profile insights for calls, direction requests and website clicks.",
        cadence: "Count weekly. Review by source monthly.",
      },
    },
    questions: [
      {
        id: "sources",
        kind: "multi",
        prompt: "Where do most of your new client enquiries come from?",
        hint: "Select everything that brings you real enquiries.",
        weight: 1,
        options: [
          { value: "instagram", label: "Instagram DMs", score: 1 },
          { value: "facebook", label: "Facebook", score: 1 },
          { value: "google-search", label: "Google Search", score: 1 },
          { value: "gbp", label: "Google Maps / Business Profile", score: 1 },
          { value: "website", label: "Website", score: 1 },
          { value: "phone", label: "Phone", score: 1 },
          { value: "referrals", label: "Referrals", score: 1 },
          { value: "other", label: "Other", score: 1 },
        ],
        specify: {
          whenValue: "other",
          prompt: "Where else do enquiries come from?",
          placeholder: "e.g. a local Facebook group, a gym I rent space in, an aesthetics directory…",
        },
        scoreSelection: (values) => ladder(values.length, [0, 0.3, 0.55, 0.78, 0.92, 1]),
        review: (values) => {
          if (values.length >= 3) {
            return {
              strength: `New clients reach you through ${values.length} different routes, so no single platform can switch your enquiries off overnight.`,
            };
          }
          return {
            gap:
              values.length === 0
                ? "No consistent source of new enquiries - growth is currently unpredictable."
                : "Almost all your enquiries arrive through one or two routes, which makes your diary vulnerable to an algorithm change or a quiet month.",
            fix: {
              action:
                "Add one owned discovery channel you control - a fully filled Google Business Profile with services, photos and a booking link - so search traffic reaches you without paying for it.",
              impact:
                "Most local wellness businesses see enquiries rise 20–40% within 90 days of a properly optimised profile, with no ad spend.",
              effort: "quick",
            },
          };
        },
      },
      {
        id: "gbp",
        kind: "choice",
        prompt: "Do you have a Google Business Profile?",
        weight: 1.3,
        options: [
          {
            value: "optimised",
            label: "Yes - fully optimised",
            score: 1,
            strength:
              "Your Google Business Profile is doing the heavy lifting in local search, which is where most 'near me' enquiries begin.",
          },
          {
            value: "basic",
            label: "Yes - but it's basic",
            score: 0.5,
            gap: "Your Google profile exists but isn't working hard - it's listed rather than competing.",
            fix: {
              action:
                "Complete every field on your profile: services with prices, 10+ recent photos, opening hours, a booking link, and the Q&A section answering your five most common questions.",
              impact:
                "A complete profile typically doubles profile views and puts you in the local map pack for your main treatments.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0,
            gap: "You have no Google Business Profile, so you're invisible in local map results - the single biggest source of ready-to-book local enquiries.",
            fix: {
              action:
                "Claim and verify your Google Business Profile this week, then complete it fully: services, photos, hours, booking link.",
              impact:
                "This is the highest-return free action available to you. Expect new enquiries from people who'd never have found you otherwise.",
              effort: "quick",
            },
          },
          {
            value: "unsure",
            label: "Not sure",
            score: 0.15,
            gap: "You're unsure whether your Google listing exists or who controls it - which usually means an unclaimed or out-of-date profile is representing you.",
            fix: {
              action:
                "Search your business name on Google Maps. If a listing exists, claim it; if not, create one. Then complete it fully.",
              impact:
                "Removes the risk of wrong hours or an old address quietly turning people away.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "reviews-count",
        kind: "slider",
        prompt: "How many Google reviews do you have?",
        weight: 1,
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 10,
        format: (v) => (v >= 100 ? "100+" : String(v)),
        endLabels: ["None", "100+"],
        scoreValue: (v) =>
          curve(v, [
            [0, 0],
            [5, 0.2],
            [15, 0.45],
            [25, 0.65],
            [50, 0.88],
            [100, 1],
          ]),
        review: (v) => {
          if (v >= 25) {
            return {
              strength: `${v >= 100 ? "100+" : v} Google reviews gives new clients the social proof they need before they'll enquire.`,
            };
          }
          return {
            gap: `With ${v} Google review${v === 1 ? "" : "s"}, you're below the threshold where new clients feel safe choosing you over a competitor.`,
            fix: {
              action:
                "Set a target of 25 reviews and ask every happy client with a direct link, sent the same day as their appointment.",
              impact:
                "Crossing 25 reviews lifts click-through from local search noticeably, and moves you up the map pack.",
              effort: "quick",
            },
          };
        },
      },
      {
        id: "website",
        kind: "choice",
        prompt: "Is your website mobile-friendly with clear booking?",
        weight: 1.2,
        options: [
          {
            value: "yes",
            label: "Yes - easy to book on a phone",
            score: 1,
            strength:
              "Your website works on a phone and makes booking obvious, so interest converts while it's hot.",
          },
          {
            value: "partial",
            label: "Partially",
            score: 0.5,
            gap: "Your website works, but booking isn't obvious enough on a phone - where most of your visitors are.",
            fix: {
              action:
                "Put one clear 'Book now' button in the header, at the top of every service page, and fixed to the bottom of the screen on mobile.",
              impact:
                "Removing the hunt for how to book typically lifts website enquiries by a third.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.2,
            gap: "Your website is hard to use on a phone, so mobile visitors - the majority - leave before enquiring.",
            fix: {
              action:
                "Rebuild the site mobile-first: readable text without zooming, tappable buttons, and booking within one tap of any page.",
              impact:
                "Mobile visitors currently bouncing become enquiries. This is often the single biggest jump in conversion available.",
              effort: "project",
            },
          },
          {
            value: "none",
            label: "I don't have a website",
            score: 0.1,
            gap: "With no website, anyone who wants to check you out before enquiring has nowhere to land - so they check a competitor instead.",
            fix: {
              action:
                "Launch a focused one-page site: what you do, who it's for, prices, photos, reviews and a booking link. It doesn't need to be big, it needs to exist.",
              impact:
                "Gives every ad, post and referral somewhere to send people, and makes you credible to first-time enquirers.",
              effort: "project",
            },
          },
        ],
      },
      {
        id: "website-url",
        kind: "text",
        prompt: "What's your website address?",
        hint: "Paste the link and we'll look at it properly alongside your answers. Leave it blank if you don't have one yet.",
        weight: 0,
        placeholder: "www.yourbusiness.co.uk",
        optional: true,
      },
      {
        id: "findability",
        kind: "scale",
        prompt: "How easy is it for someone searching for your service nearby to find you?",
        weight: 0.8,
        lowLabel: "Nearly impossible",
        highLabel: "Top of the results",
        review: (v) =>
          v >= 4
            ? { strength: "You show up when people search locally - the moment they're most ready to book." }
            : {
                gap: "You don't reliably appear when local people search for what you offer, so ready-to-book demand goes elsewhere.",
                fix: {
                  action:
                    "Search your main treatment plus your town in a private browser window. Note who ranks above you, then match them on reviews, photos and service detail in your profile.",
                  impact: "Puts you in front of people already looking to book, at zero cost per enquiry.",
                  effort: "quick",
                },
              },
      },
    ],
  },
  {
    id: "lead-response",
    title: "Lead Response",
    shortTitle: "Response",
    context: "When someone reaches out, what happens next?",
    why:
      "Response speed is the highest-leverage number in your business. Enquiries answered in five minutes convert several times better than ones answered an hour later - and the enquiry you've already paid for is the cheapest one to win.",
    weight: 1.3,
    verdict: {
      strong:
        "You answer fast and consistently, which means the enquiries you work hard to generate actually turn into bookings rather than cooling off in an inbox.",
      ok:
        "You do respond - but not fast enough, or not consistently when you're busy. That gap is where enquiries quietly go to a competitor who replied first.",
      weak:
        "Enquiries are waiting hours or longer for a reply. This is almost certainly the most expensive gap in your journey: you're paying for attention and then losing it in the window that matters most.",
    },
    tools: [
      "An instant auto-reply on Instagram, Facebook and your website form",
      "A shared inbox that pulls every channel into one place",
      "A saved reply template with your three most common answers",
    ],
    purpose: "Answer every enquiry the moment it lands",
    kpi: {
      name: "Enquiry response time",
      metric: "How long a new enquiry waits before it gets a useful reply",
      why: "It's the fastest-moving number you have: replies inside five minutes convert several times better than replies an hour later, and it costs nothing but a system.",
      supports: ["lead-response", "lead-nurture", "booking"],
      current: (answers) => label(answers, "lead-response", "speed"),
      target: () => "Under five minutes, every time, including when you're with a client",
      measure: {
        what: "Minutes between an enquiry landing and a useful reply going out.",
        where:
          "The timestamps already in your inbox and your Instagram and Facebook threads. Take the last ten enquiries and write down the gap for each.",
        cadence: "Weekly, on a sample of ten. Watch the worst one, not the average.",
      },
    },
    questions: [
      {
        id: "speed",
        kind: "choice",
        prompt: "When a new enquiry comes in, how quickly do you typically respond?",
        weight: 1.5,
        options: [
          {
            value: "5min",
            label: "Within 5 minutes",
            score: 1,
            strength:
              "You reply within five minutes - the window where interest is highest and competitors haven't answered yet.",
          },
          {
            value: "1hour",
            label: "Within an hour",
            score: 0.7,
            gap: "An hour is good, but the first five minutes is where the booking is won - after that, enquiries start shopping around.",
            fix: {
              action:
                "Add an instant automated acknowledgement that answers the two questions everyone asks (price and availability) and offers a booking link, so the five-minute window is covered even when you're with a client.",
              impact: "Holds attention until you can reply personally. Typically lifts enquiry-to-booking by 10–20%.",
              effort: "quick",
            },
          },
          {
            value: "sameday",
            label: "Same day",
            score: 0.35,
            gap: "Same-day replies mean most enquiries sit unanswered for hours, by which point many have booked elsewhere.",
            fix: {
              action:
                "Set up an instant auto-response on every channel, then batch personal replies twice a day at fixed times.",
              impact:
                "Turns a same-day business into a five-minute business without adding hours to your week.",
              effort: "quick",
            },
          },
          {
            value: "nextday",
            label: "Next day or longer",
            score: 0.1,
            gap: "Enquiries wait a day or more, and most people booking a wellness or beauty appointment will have chosen someone else by then.",
            fix: {
              action:
                "Put an instant auto-reply on every enquiry channel this week, and set a single daily slot to clear the inbox properly.",
              impact:
                "This alone can recover a meaningful share of enquiries you're currently losing without ever seeing them.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "auto-response",
        kind: "choice",
        prompt: "Do you have any automated instant response?",
        weight: 1.2,
        options: [
          {
            value: "chatbot",
            label: "Yes - a chatbot or assistant",
            score: 1,
            strength:
              "An automated assistant catches every enquiry instantly, so nothing waits on you being free.",
          },
          {
            value: "autoreply",
            label: "Yes - a simple auto-reply",
            score: 0.75,
            strength: "An auto-reply holds attention the moment someone gets in touch.",
            fix: {
              action:
                "Upgrade the auto-reply to answer the three questions you get most (price, availability, what's involved) and include a direct booking link.",
              impact: "Turns a holding message into a booking, without you touching it.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0,
            gap: "Nothing happens automatically when someone enquires, so every enquiry waits for you to be free.",
            fix: {
              action:
                "Switch on instant replies on Instagram and Facebook, and an automatic confirmation email on your website form. Include your prices and a booking link.",
              impact:
                "Every enquiry gets acknowledged in seconds, which stops people messaging three other businesses while they wait.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "while-busy",
        kind: "choice",
        prompt: "What happens when an enquiry comes in while you're with a client?",
        weight: 1.1,
        options: [
          {
            value: "waits",
            label: "It waits until I'm free",
            score: 0.15,
            gap: "Enquiries that land while you're with a client sit untouched - and that's most of your working day.",
            fix: {
              action:
                "Cover your in-clinic hours with an automated first response so nobody waits for a chair to empty.",
              impact:
                "Recovers the enquiries that arrive during your busiest, most profitable hours.",
              effort: "quick",
            },
          },
          {
            value: "someone",
            label: "Someone else responds",
            score: 0.9,
            strength: "Someone is always covering enquiries, so being with a client doesn't cost you bookings.",
          },
          {
            value: "auto",
            label: "An automated response goes out",
            score: 1,
            strength:
              "Automation covers you while you're working, so enquiries are held even during a full day of appointments.",
          },
          {
            value: "between",
            label: "I check between clients",
            score: 0.45,
            gap: "Checking between clients means replies land in unpredictable bursts, and anything arriving during a long treatment goes cold.",
            fix: {
              action:
                "Add an instant auto-response so the gap between clients isn't the thing your enquiries depend on.",
              impact: "Consistent response times without checking your phone mid-treatment.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "script",
        kind: "choice",
        prompt: "Do you have a standard response script or template?",
        weight: 0.9,
        options: [
          {
            value: "yes",
            label: "Yes",
            score: 1,
            strength: "A standard reply keeps your response quality consistent and fast, however busy the day is.",
          },
          {
            value: "partial",
            label: "Partially",
            score: 0.5,
            gap: "Your replies vary depending on the day, so some enquiries get a much weaker answer than others.",
            fix: {
              action:
                "Write three saved replies: first enquiry, price question, and 'thinking about it'. Each one should answer the question, reassure, and end with a booking link.",
              impact: "Faster replies, better answers, and one less decision to make when you're tired.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.15,
            gap: "Every reply is written from scratch, which makes responding slower and the quality inconsistent.",
            fix: {
              action:
                "Write and save three response templates covering your most common enquiries, with a clear next step in each.",
              impact: "Cuts response time dramatically and lifts conversion on the enquiries you already have.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "tracking",
        kind: "choice",
        prompt: "Do you track how many enquiries you receive versus how many book?",
        weight: 1,
        options: [
          {
            value: "system",
            label: "Yes - with a system",
            score: 1,
            strength: "You measure enquiry-to-booking, which means you can see improvements rather than guess at them.",
          },
          {
            value: "manual",
            label: "Yes - manually",
            score: 0.65,
            strength: "You're tracking conversions, even if it's by hand.",
            fix: {
              action:
                "Move your manual tally into a simple CRM or shared sheet with source, date and outcome so patterns show up on their own.",
              impact: "Shows you which channel is actually producing paying clients, so you invest where it works.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.1,
            gap: "Without tracking enquiries versus bookings, you can't see where clients are being lost - or whether anything you change is working.",
            fix: {
              action:
                "Start a one-line-per-enquiry log: date, source, whether they booked. Review it monthly.",
              impact:
                "Within a month you'll know your true conversion rate and which source deserves your attention.",
              effort: "quick",
            },
          },
        ],
      },
    ],
  },
  {
    id: "lead-nurture",
    title: "Lead Nurture & Follow-Up",
    shortTitle: "Nurture",
    context: "What happens when someone enquires but doesn't book immediately?",
    why:
      "Most enquiries aren't a no - they're a not right now. Without follow-up, every one of those becomes a no by default, and you paid for all of them.",
    weight: 1,
    verdict: {
      strong:
        "You follow up properly, so interest that doesn't convert on day one still becomes a booking later. That's revenue most businesses in your sector simply leave behind.",
      ok:
        "You follow up sometimes - usually when you remember. A consistent sequence would turn the enquiries you're already generating into noticeably more bookings.",
      weak:
        "Once someone doesn't book immediately, nothing happens. You're effectively paying to generate enquiries and then discarding the ones who weren't ready that day.",
    },
    tools: [
      "A three-touch follow-up sequence (day 1, day 3, day 7)",
      "Email and SMS automation triggered by an unconverted enquiry",
      "A time-limited incentive for first-time bookings",
    ],
    purpose: "Follow up until they decide",
    kpi: {
      name: "Enquiry-to-client conversion",
      metric: "The share of enquiries that become paying clients",
      why: "You've already paid for these people's attention. Lifting this number costs nothing extra and shows up in the diary within weeks.",
      supports: ["lead-nurture", "lead-response", "booking"],
      current: (answers) => {
        const value = num(answers, "lead-nurture.conversion-rate");
        return value === null ? null : `${value}%`;
      },
      target: (answers) => {
        const value = num(answers, "lead-nurture.conversion-rate");
        if (value === null) return "Measured first, then lifted by 10–15 points";
        return `${Math.min(value + 15, 70)}%`;
      },
      measure: {
        what: "The share of enquiries that become paying clients.",
        where:
          "Your enquiry log: enquiries in one column, first appointments in the other. Count last month's enquiries, not this month's - they need time to book.",
        cadence: "Monthly, always a month behind.",
      },
    },
    questions: [
      {
        id: "followup",
        kind: "choice",
        prompt: "If someone enquires but doesn't book right away, what happens?",
        weight: 1.4,
        options: [
          {
            value: "manual",
            label: "I follow up manually",
            score: 0.6,
            strength: "You do chase enquiries, which already puts you ahead of most.",
            fix: {
              action:
                "Automate the first three follow-ups so they go out whether or not you have capacity that week, and keep your manual touch for the ones who reply.",
              impact: "Removes the 'I meant to message them' loss without adding to your workload.",
              effort: "project",
            },
          },
          {
            value: "automated",
            label: "An automated follow-up sequence runs",
            score: 1,
            strength:
              "Automated follow-up means no enquiry goes cold just because you had a full diary that week.",
          },
          {
            value: "nothing",
            label: "Nothing - I wait for them",
            score: 0,
            gap: "Enquiries that don't book immediately are never contacted again, so interest you already generated expires silently.",
            fix: {
              action:
                "Build a three-message follow-up: next day (helpful answer), day three (reassurance plus a review), day seven (a reason to book now).",
              impact:
                "Following up three times typically converts an extra 10–25% of enquiries that would otherwise have gone quiet.",
              effort: "project",
            },
          },
          {
            value: "mix",
            label: "A mix - it depends how busy I am",
            score: 0.35,
            gap: "Follow-up depends on how busy you are, which means the busiest weeks - your best lead weeks - get the least follow-up.",
            fix: {
              action:
                "Systemise the first three touches so they happen regardless of your week, and step in personally only when someone replies.",
              impact: "Makes your conversion rate consistent instead of seasonal.",
              effort: "project",
            },
          },
        ],
      },
      {
        id: "touchpoints",
        kind: "choice",
        prompt: "How many follow-up touchpoints do you have?",
        weight: 1.1,
        options: [
          {
            value: "0",
            label: "None",
            score: 0,
            gap: "There's no follow-up at all after the first reply.",
            fix: {
              action: "Add at least three follow-up touches over the first week after an enquiry.",
              impact: "Most bookings from 'thinking about it' enquiries come on touch two or three.",
              effort: "project",
            },
          },
          {
            value: "1-2",
            label: "One or two",
            score: 0.5,
            gap: "One or two touches stops just before the point where most undecided enquiries actually book.",
            fix: {
              action: "Extend your sequence to five touches across two weeks, varying the angle each time - helpful, reassuring, then time-bound.",
              impact: "Captures the slower decision-makers without any extra enquiry cost.",
              effort: "quick",
            },
          },
          {
            value: "3-5",
            label: "Three to five",
            score: 0.9,
            strength: "Three to five touches covers the window where most undecided enquiries make their decision.",
          },
          {
            value: "5+",
            label: "More than five",
            score: 1,
            strength: "A full follow-up sequence means very few enquiries slip away unattended.",
          },
        ],
      },
      {
        id: "nurture-sequence",
        kind: "choice",
        prompt: "Do you have an email or SMS nurture sequence?",
        weight: 1,
        options: [
          {
            value: "yes",
            label: "Yes",
            score: 1,
            strength: "A nurture sequence keeps you in mind while people decide, without you doing anything.",
          },
          {
            value: "partial",
            label: "Partially",
            score: 0.5,
            gap: "Your nurture is partly built, so some enquiries get looked after and others don't.",
            fix: {
              action:
                "Finish the sequence: five emails over two weeks covering what to expect, results, reviews, common worries and an invitation to book.",
              impact: "Converts the undecided without another conversation from you.",
              effort: "project",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.05,
            gap: "There's nothing keeping you in mind between the enquiry and the decision, so you're competing against whoever messaged them last.",
            fix: {
              action:
                "Write a five-email nurture sequence once, automate it, and let it run for every new enquiry.",
              impact: "Turns a single reply into two weeks of presence - for one afternoon of work.",
              effort: "project",
            },
          },
        ],
      },
      {
        id: "incentive",
        kind: "choice",
        prompt: "Do you offer any incentive to book?",
        weight: 0.8,
        options: [
          {
            value: "yes",
            label: "Yes",
            score: 1,
            strength: "A clear reason to book now shortens the gap between interest and payment.",
          },
          {
            value: "sometimes",
            label: "Sometimes",
            score: 0.55,
            gap: "Your offer changes depending on the conversation, so there's no consistent reason to book today rather than someday.",
            fix: {
              action:
                "Choose one standing first-visit offer - a consultation credit, an add-on, or a small saving on the first booking - and use it in every follow-up.",
              impact: "Gives undecided enquiries a deadline, which is usually what converts them.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.3,
            gap: "Nothing creates urgency, so 'I'll think about it' has no natural end date.",
            fix: {
              action:
                "Add one time-limited first-visit offer to your day-seven follow-up. Keep it modest - the deadline matters more than the discount.",
              impact: "Recovers enquiries that were interested but never had a reason to decide.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "website-capture",
        kind: "choice",
        prompt: "If someone isn't ready to book, can they leave their details on your website?",
        hint: "An enquiry form, a callback request, a waitlist - anything that captures them before they leave.",
        weight: 1,
        options: [
          {
            value: "yes",
            label: "Yes - a form or enquiry option",
            score: 1,
            strength:
              "People who aren't ready to book can still leave their details, so browsing traffic doesn't disappear unrecorded.",
          },
          {
            value: "contact-only",
            label: "Only my phone number or email address",
            score: 0.4,
            gap: "Visitors have to compose a message themselves, which is enough friction that most simply leave.",
            fix: {
              action:
                "Add a short enquiry form - name, contact, treatment they're interested in - to your main service pages, and reply to it with your standard first response.",
              impact: "Captures the people who are interested but not ready, instead of losing them silently.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.05,
            gap: "There's no way to capture someone who isn't ready to book today, so every undecided visitor is lost for good.",
            fix: {
              action:
                "Put a simple enquiry form on your site and connect it to your follow-up sequence, so interest is captured even when it isn't a booking yet.",
              impact:
                "Turns anonymous website traffic into enquiries you can follow up - usually the cheapest new leads available to you.",
              effort: "project",
            },
          },
          {
            value: "none",
            label: "I don't have a website",
            score: 0.1,
            gap: "With no website, there's nowhere for interested people to land or leave their details.",
            fix: {
              action:
                "Launch a single page with your services, prices, photos and an enquiry form. It doesn't need to be big - it needs to exist.",
              impact: "Gives every post, ad and referral somewhere to send people.",
              effort: "project",
            },
          },
        ],
      },
      {
        id: "conversion-rate",
        kind: "slider",
        prompt: "What percentage of initial enquiries become paying clients?",
        weight: 1.1,
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 30,
        unit: "%",
        endLabels: ["0%", "100%"],
        scoreValue: (v) =>
          curve(v, [
            [0, 0],
            [15, 0.25],
            [30, 0.55],
            [50, 0.8],
            [70, 1],
          ]),
        unknown: {
          label: "I don't know",
          score: 0.3,
          gap: "You don't yet know what share of enquiries become clients, so you can't tell whether a change has helped or hurt.",
          fix: {
            action:
              "Keep a one-line log for the next month: date, where the enquiry came from, whether they booked. That's your conversion rate.",
            impact:
              "Within four weeks you'll know your true number and which source is actually worth your time.",
            effort: "quick",
          },
        },
        review: (v) =>
          v >= 50
            ? { strength: `Converting ${v}% of enquiries into clients is strong - your problem is volume, not persuasion.` }
            : {
                gap: `Only ${v}% of your enquiries become paying clients, so the majority of the interest you generate never turns into revenue.`,
                fix: {
                  action:
                    "Fix response speed and follow-up first - they move conversion faster than anything else - then review what your first reply actually says.",
                  impact: `Lifting conversion from ${v}% to ${Math.min(v + 15, 85)}% is the same as increasing your enquiries by a third, at no extra cost.`,
                  effort: "project",
                },
              },
      },
    ],
  },
  {
    id: "booking",
    title: "Booking Process",
    shortTitle: "Booking",
    context: "Let's look at how clients actually book with you.",
    why:
      "Every extra step between 'I want this' and 'it's in the diary' loses people. Booking friction costs you clients who had already decided to buy.",
    weight: 1,
    verdict: {
      strong:
        "Booking is effortless: clients can commit the moment they decide, without waiting on you. That protects every enquiry your marketing works to create.",
      ok:
        "Clients can book, but there's friction in the way - steps, waiting, or back-and-forth that costs you the ones who were ready.",
      weak:
        "Booking depends on you being available to arrange it. People who wanted to book at 9pm on a Sunday simply don't, and you never know they existed.",
    },
    tools: [
      "24/7 online booking linked from every profile and page",
      "Deposits taken at the point of booking",
      "A single booking link used everywhere, so there's one route in",
    ],
    purpose: "Make booking effortless and always open",
    kpi: {
      name: "Bookings taken without you",
      metric: "The share of appointments booked online, at any hour, with no messages in between",
      why: "Most personal appointments are booked outside working hours. Every booking that needs you is one you can lose to timing.",
      supports: ["booking", "lead-response", "lead-sources"],
      current: (answers) => label(answers, "booking", "247"),
      target: () => "Every core service bookable 24/7 in two taps",
      measure: {
        what: "The share of bookings made online, with no messages exchanged first.",
        where:
          "Your booking system's report of online bookings versus ones you entered by hand. If it doesn't split them, tally manual bookings for a fortnight.",
        cadence: "Monthly.",
      },
    },
    questions: [
      {
        id: "method",
        kind: "choice",
        prompt: "How do clients book with you?",
        weight: 1.3,
        options: [
          {
            value: "online",
            label: "Online, self-service",
            score: 1,
            strength: "Clients book themselves, so nothing waits on you and no enquiry is lost to timing.",
          },
          {
            value: "dm",
            label: "DM or message, then I arrange it",
            score: 0.35,
            gap: "Booking runs through conversation, so every appointment costs you messages and every delay costs you clients.",
            fix: {
              action:
                "Put a self-service booking link in your bio, auto-replies and website, and use it as the default answer to 'do you have availability?'",
              impact:
                "Removes hours of admin a week and captures the bookings that happen outside your working hours.",
              effort: "project",
            },
          },
          {
            value: "phone",
            label: "By phone",
            score: 0.3,
            gap: "Phone-only booking excludes anyone who won't ring - which is most people under 40 enquiring about a beauty or wellness appointment.",
            fix: {
              action: "Add online booking alongside the phone, and keep the phone for complex or first-time consultations.",
              impact: "Opens up bookings from people who'd never have called.",
              effort: "project",
            },
          },
          {
            value: "mix",
            label: "A mix",
            score: 0.6,
            gap: "A mix of routes means some clients get a smooth booking and others get a conversation - and the ones who need it easiest usually get the slowest route.",
            fix: {
              action: "Make online booking the default everywhere, and treat manual booking as the exception.",
              impact: "Consistent, immediate booking for everyone, less admin for you.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "steps",
        kind: "choice",
        prompt: "How many steps or clicks does it take to complete a booking?",
        weight: 1,
        options: [
          { value: "1-2", label: "One or two", score: 1, strength: "Booking takes a couple of taps, so decided clients stay decided." },
          {
            value: "3-4",
            label: "Three or four",
            score: 0.7,
            gap: "Three or four steps is workable, but each one loses a few people who were ready.",
            fix: {
              action: "Cut any field you don't need at the point of booking. Collect the rest afterwards, on the confirmation.",
              impact: "Fewer abandoned bookings, especially on mobile.",
              effort: "quick",
            },
          },
          {
            value: "5+",
            label: "Five or more",
            score: 0.3,
            gap: "Your booking takes five or more steps, and a meaningful share of people drop out partway through.",
            fix: {
              action:
                "Strip the booking down to service, time, name, contact and payment. Move consent forms and history to a follow-up link after booking.",
              impact: "Shorter booking flows routinely recover 15–30% of abandoned bookings.",
              effort: "project",
            },
          },
          {
            value: "unknown",
            label: "I don't know",
            score: 0.35,
            gap: "You haven't been through your own booking process recently, so you can't see where people give up.",
            fix: {
              action: "Book yourself in on your phone, from your Instagram bio, timing each step. Note anything that made you pause.",
              impact: "You'll usually find one obvious blocker worth fixing in an afternoon.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "247",
        kind: "choice",
        prompt: "Can clients book 24/7 without your involvement?",
        weight: 1.2,
        options: [
          {
            value: "yes",
            label: "Yes",
            score: 1,
            strength: "Clients can book at any hour, so you capture the evening and weekend decisions most businesses miss.",
          },
          {
            value: "partial",
            label: "Partially",
            score: 0.55,
            gap: "Only some services or times can be booked independently, so parts of your diary still depend on you being awake.",
            fix: {
              action: "Open every bookable service to online booking, even if you cap the number of slots you release.",
              impact: "Captures bookings made in the evening, which is when most clients make personal appointments.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.1,
            gap: "Nothing can be booked without you, so every enquiry outside working hours waits - and many don't.",
            fix: {
              action: "Set up online booking with your real availability, and link it from your bio, website and auto-replies.",
              impact:
                "Most wellness and beauty bookings are made outside 9–5. This opens a window that's currently closed.",
              effort: "project",
            },
          },
        ],
      },
      {
        id: "deposit",
        kind: "choice",
        prompt: "Do you require a deposit or card on file?",
        weight: 1,
        options: [
          {
            value: "always",
            label: "Yes - always",
            score: 1,
            strength: "Taking a deposit at booking commits the client and protects your diary from no-shows.",
          },
          {
            value: "sometimes",
            label: "Sometimes",
            score: 0.55,
            gap: "Deposits are inconsistent, so the appointments most at risk of a no-show often aren't the ones you secured.",
            fix: {
              action: "Apply the same deposit rule to every booking, stated plainly at the point of booking.",
              impact: "Consistency reduces no-shows and removes the awkward case-by-case decision.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.2,
            gap: "With no deposit or card on file, a missed appointment costs you the full slot with no recovery.",
            fix: {
              action:
                "Introduce a modest deposit that comes off the treatment price, framed as securing their slot rather than as a penalty.",
              impact: "Businesses introducing deposits typically see no-shows fall by half or more.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "prices",
        kind: "choice",
        prompt: "Can people see your prices before they book?",
        hint: "On your website, your profile, or wherever they find you.",
        weight: 1,
        options: [
          {
            value: "yes",
            label: "Yes - prices are published",
            score: 1,
            strength:
              "Publishing prices filters out the wrong enquiries and lets the right ones book without a conversation first.",
          },
          {
            value: "from",
            label: "Yes - a 'from' price or a range",
            score: 0.8,
            strength: "A guide price gives people enough to decide with, which keeps bookings moving.",
          },
          {
            value: "on-request",
            label: "Only if they ask",
            score: 0.3,
            gap: "Prices only appear on request, so everyone has to start a conversation - and most people won't.",
            fix: {
              action:
                "Publish a price or a 'from' price for every core treatment. If prices vary, publish the range and say what moves it.",
              impact:
                "Fewer time-wasting enquiries, more people arriving ready to book, and far less back-and-forth for you.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.15,
            gap: "Nobody can find out what you charge without contacting you, which quietly filters out people who'd have booked.",
            fix: {
              action: "Publish 'from' prices for your main treatments this week - start with your three most-booked.",
              impact:
                "Removes the single most common reason people leave a wellness or beauty website without enquiring.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "friction-signals",
        kind: "multi",
        prompt: "Which of these happen when someone tries to book with you?",
        hint: "Tick anything that sounds familiar - this is what friction looks like in practice.",
        weight: 0.9,
        options: [
          { value: "asks-availability", label: "They message to ask what availability you have", score: 0 },
          { value: "needs-me", label: "I have to reply before they can book anything", score: 0 },
          { value: "no-prices", label: "They ask what it costs because prices aren't published", score: 0 },
          { value: "office-hours", label: "Booking only really works during working hours", score: 0 },
          { value: "forms-first", label: "They have to fill in forms before they can book", score: 0 },
          { value: "drop-off", label: "People start booking and don't finish", score: 0 },
          { value: "none", label: "None of these - they book in a couple of taps", score: 1 },
        ],
        scoreSelection: (values) => {
          const signals = values.filter((v) => v !== "none");
          if (signals.length === 0) return 1;
          return ladder(signals.length, [1, 0.7, 0.45, 0.25, 0.1]);
        },
        review: (values) => {
          const signals = values.filter((v) => v !== "none");
          if (signals.length === 0) {
            return {
              strength: "Nothing gets between deciding and booking - which is exactly where you want to be.",
            };
          }
          return {
            gap: `You recognise ${signals.length} point${signals.length === 1 ? "" : "s"} of friction in your booking process, and each one loses people who had already decided to book.`,
            fix: {
              action:
                "Book yourself in on your own phone, from your Instagram bio, timing each step. Remove the first thing that made you pause - usually a question the client shouldn't have to ask.",
              impact:
                "Every step removed converts more of the people who already wanted to book, at no extra marketing cost.",
              effort: "quick",
            },
          };
        },
      },
    ],
  },
  {
    id: "confirmation",
    title: "Confirmation & Pre-Appointment",
    shortTitle: "Pre-visit",
    context: "What happens between booking and arrival?",
    why:
      "The gap between booking and arrival is where doubt creeps in. What you send in that window decides whether someone turns up relaxed, prepared and ready to rebook - or nervous, late, or not at all.",
    weight: 1,
    verdict: {
      strong:
        "Clients arrive knowing exactly what to expect, prepared and confident. That shows up as fewer no-shows, calmer appointments and better first impressions.",
      ok:
        "The basics are covered, but the pre-appointment experience is doing less work than it could - leaving clients to fill the gaps themselves.",
      weak:
        "Once someone books, they hear very little until they arrive. That silence costs you attendance, preparation and the confidence that makes a first visit convert into a second.",
    },
    tools: [
      "Automated confirmation by email and SMS at the moment of booking",
      "A 'what to expect' message sent 48 hours before",
      "Digital consultation and consent forms completed before arrival",
    ],
    purpose: "Prepare every client before they arrive",
    kpi: {
      name: "First-appointment attendance",
      metric: "The share of first-time bookings that arrive, prepared and on time",
      why: "First visits are where clients are most likely to get cold feet - and where a good experience turns into a rebooking.",
      supports: ["confirmation", "reminders", "booking"],
      current: (answers) => label(answers, "confirmation", "confirmation"),
      target: () => "Automated confirmation, preparation and forms before every first visit",
      measure: {
        what: "The share of first-time bookings that arrive, and how many forms are completed before the appointment.",
        where: "Your booking system: new clients booked against new clients attended.",
        cadence: "Monthly.",
      },
    },
    questions: [
      {
        id: "confirmation",
        kind: "choice",
        prompt: "Do clients receive an automated booking confirmation?",
        weight: 1.3,
        options: [
          {
            value: "both",
            label: "Yes - email and SMS",
            score: 1,
            strength: "Confirmations go out on two channels automatically, so nobody is left wondering whether their booking landed.",
          },
          {
            value: "email",
            label: "Yes - email only",
            score: 0.7,
            strength: "Bookings are confirmed automatically by email.",
            fix: {
              action: "Add an SMS confirmation alongside the email - texts are opened far more reliably than email.",
              impact: "Fewer 'did my booking go through?' messages, and fewer forgotten appointments.",
              effort: "quick",
            },
          },
          {
            value: "sms",
            label: "Yes - SMS only",
            score: 0.75,
            strength: "SMS confirmation reaches clients where they'll actually see it.",
            fix: {
              action: "Add an email confirmation too, carrying the detail an SMS can't - location, preparation, policy.",
              impact: "Gives clients something to refer back to, which reduces questions and late arrivals.",
              effort: "quick",
            },
          },
          {
            value: "manual",
            label: "I confirm manually",
            score: 0.35,
            gap: "Confirmations depend on you remembering, so some clients get one late and some don't get one at all.",
            fix: {
              action: "Switch on automatic confirmation in your booking system so it's sent the second a booking is made.",
              impact: "Removes an admin task entirely and makes the experience consistent.",
              effort: "quick",
            },
          },
          {
            value: "none",
            label: "None",
            score: 0,
            gap: "Clients get no confirmation, so their first experience of you is uncertainty about whether they're actually booked.",
            fix: {
              action: "Turn on automated email and SMS confirmation at the point of booking, including date, time, address and what to bring.",
              impact: "Immediate drop in no-shows and inbound 'just checking' messages.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "prep-info",
        kind: "choice",
        prompt: "Do you send preparation instructions or 'what to expect' information?",
        weight: 1.1,
        options: [
          {
            value: "auto",
            label: "Yes - automatically",
            score: 1,
            strength: "Every client arrives prepared because the information reaches them without you sending it.",
          },
          {
            value: "manual",
            label: "Yes - manually",
            score: 0.6,
            strength: "You do prepare clients before they arrive.",
            fix: {
              action: "Automate the message you already send so it goes out 48 hours before every appointment.",
              impact: "Same experience for every client, none of the admin.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.1,
            gap: "Clients arrive without knowing how to prepare or what will happen, which creates nerves, late arrivals and avoidable cancellations.",
            fix: {
              action:
                "Write one 'what to expect' message - parking, arrival time, how long it takes, what to avoid beforehand, how they'll feel afterwards - and automate it 48 hours ahead.",
              impact: "Fewer no-shows, calmer first visits, and a noticeably more premium impression.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "forms",
        kind: "choice",
        prompt: "Do clients complete consultation or consent forms before arrival?",
        weight: 1,
        options: [
          {
            value: "online-before",
            label: "Yes - online, before they arrive",
            score: 1,
            strength: "Forms are done before arrival, so appointments start on time and your notes are complete.",
          },
          {
            value: "on-arrival",
            label: "Yes - on arrival",
            score: 0.5,
            gap: "Paperwork on arrival eats into treatment time and starts the visit with admin rather than care.",
            fix: {
              action: "Move consultation and consent forms online, linked from the confirmation, and make completion a condition of the appointment.",
              impact: "Gives you back several minutes per client and a cleaner, more professional first impression.",
              effort: "project",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.2,
            gap: "Without forms before arrival, you're gathering essential information in the room - or not at all.",
            fix: {
              action: "Set up digital consultation and consent forms sent automatically after booking.",
              impact: "Protects you professionally and makes appointments run to time.",
              effort: "project",
            },
          },
        ],
      },
      {
        id: "expectations",
        kind: "choice",
        prompt: "Do you set expectations about the appointment itself?",
        weight: 0.9,
        options: [
          {
            value: "yes",
            label: "Yes",
            score: 1,
            strength: "Clients know what will happen, which builds trust before they've even met you.",
          },
          {
            value: "partial",
            label: "Partially",
            score: 0.5,
            gap: "Expectations are set inconsistently, so some clients arrive confident and others arrive unsure.",
            fix: {
              action: "Standardise one short pre-appointment message covering timing, what happens in the room, and aftercare.",
              impact: "Fewer surprises, better reviews, and a stronger case for rebooking.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.15,
            gap: "Clients arrive without a clear picture of the appointment, which makes first visits feel riskier than they are.",
            fix: {
              action: "Add a short 'here's how your appointment will go' section to your confirmation.",
              impact: "Nervous first-timers turn up rather than quietly cancelling.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "confidence",
        kind: "scale",
        prompt: "How confident are clients about what will happen when they arrive?",
        weight: 0.8,
        lowLabel: "Not at all",
        highLabel: "Completely",
        review: (v) =>
          v >= 4
            ? { strength: "Clients arrive confident, which is exactly the state you want them in before a first treatment." }
            : {
                gap: "Clients aren't fully confident about what's coming, and uncertainty is a common reason first appointments get cancelled.",
                fix: {
                  action: "Send a short pre-appointment message answering the three questions first-timers always ask.",
                  impact: "Turns nervous bookings into attended, relaxed appointments.",
                  effort: "quick",
                },
              },
      },
    ],
  },
  {
    id: "reminders",
    title: "Reminders & No-Show Prevention",
    shortTitle: "Reminders",
    context: "How do you make sure clients actually show up?",
    why:
      "A no-show is the most expensive thing in your diary: you've already paid to win that client, blocked the time, and there's nothing to sell in its place. Reminders are the cheapest revenue protection you can buy.",
    weight: 1.25,
    verdict: {
      strong:
        "Your reminder system is doing its job, and the diary you fill is the diary you actually work. That's straight profit protected.",
      ok:
        "Reminders exist but aren't tight enough. Every missed appointment here is revenue you'd already earned and then lost.",
      weak:
        "There's little standing between a booking and an empty slot. This is usually the fastest area to fix, and the one that pays for itself within weeks.",
    },
    tools: [
      "Automated SMS and email reminders at 48 hours and 24 hours",
      "A clearly stated cancellation policy shown at booking",
      "An automatic message the same day someone misses an appointment",
    ],
    purpose: "Protect the diary you've already filled",
    kpi: {
      name: "No-show rate",
      metric: "The share of booked appointments that don't turn up or cancel too late to refill",
      why: "It's the most expensive number in the business: the client was won, the time was blocked, and there's nothing to sell in its place.",
      supports: ["reminders", "confirmation", "booking"],
      current: (answers) => {
        const value = answer(answers, "reminders.noshow-rate");
        if (value === UNKNOWN) return "Not measured yet";
        return typeof value === "number" ? `${value}%` : null;
      },
      target: (answers) => {
        const value = answer(answers, "reminders.noshow-rate");
        if (typeof value !== "number") return "Measured weekly, then under 5%";
        return value <= 5 ? "Held under 5%" : `Under ${Math.max(5, Math.round(value / 2))}%`;
      },
      measure: {
        what: "Missed and late-cancelled appointments as a share of everything booked.",
        where:
          "Mark every no-show in the diary as it happens - most booking systems will then report the rate for you. Count late cancellations you couldn't refill as no-shows.",
        cadence: "Tally weekly, work out the rate monthly.",
      },
    },
    questions: [
      {
        id: "reminders",
        kind: "choice",
        prompt: "Do clients receive appointment reminders?",
        weight: 1.4,
        options: [
          {
            value: "both",
            label: "Yes - automated email and SMS",
            score: 1,
            strength: "Automated reminders on both channels give you the strongest possible protection against forgotten appointments.",
          },
          {
            value: "sms",
            label: "Yes - automated SMS",
            score: 0.85,
            strength: "Automated SMS reminders reach clients reliably.",
            fix: {
              action: "Add an email reminder alongside the SMS so the detail - address, preparation, policy - is there too.",
              impact: "Catches the clients who don't read texts and reduces late arrivals.",
              effort: "quick",
            },
          },
          {
            value: "email",
            label: "Yes - automated email",
            score: 0.65,
            strength: "Email reminders are going out automatically.",
            fix: {
              action: "Add SMS reminders - texts are opened within minutes, emails often aren't opened at all.",
              impact: "SMS reminders typically cut no-shows further than email alone.",
              effort: "quick",
            },
          },
          {
            value: "manual",
            label: "I remind people manually",
            score: 0.4,
            gap: "Reminders depend on you having time, so the busiest weeks - when a no-show hurts most - get the fewest reminders.",
            fix: {
              action: "Switch reminders on in your booking system at 48 and 24 hours so they run without you.",
              impact: "Consistent attendance and one less job on a full day.",
              effort: "quick",
            },
          },
          {
            value: "none",
            label: "No reminders",
            score: 0,
            gap: "Clients receive no reminder, so every appointment relies on them remembering something they booked weeks ago.",
            fix: {
              action: "Turn on automated SMS reminders at 48 and 24 hours before every appointment.",
              impact: "This one change commonly halves no-shows within a month.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "reminder-timing",
        kind: "multi",
        prompt: "When are reminders sent?",
        hint: "Select every reminder you currently send.",
        weight: 1,
        options: [
          { value: "1week", label: "One week before", score: 1 },
          { value: "48h", label: "48 hours before", score: 1 },
          { value: "24h", label: "24 hours before", score: 1 },
          { value: "2h", label: "Two hours before", score: 1 },
          { value: "morning", label: "Morning of", score: 1 },
        ],
        scoreSelection: (values) => ladder(values.length, [0, 0.45, 0.8, 1]),
        review: (values) => {
          if (values.length >= 2) {
            return { strength: `You remind clients ${values.length} times before an appointment, which is where the no-show rate really drops.` };
          }
          return {
            gap:
              values.length === 0
                ? "No reminder touchpoints at all - attendance depends entirely on memory."
                : "A single reminder leaves a long silent gap between booking and appointment.",
            fix: {
              action: "Send two reminders: 48 hours before (long enough to rebook rather than cancel) and 24 hours before.",
              impact: "The 48-hour reminder converts would-be no-shows into reschedules, which keeps the revenue.",
              effort: "quick",
            },
          };
        },
      },
      {
        id: "noshow-rate",
        kind: "slider",
        prompt: "What's your approximate no-show or late-cancellation rate?",
        weight: 1.3,
        min: 0,
        max: 30,
        step: 1,
        defaultValue: 10,
        unit: "%",
        format: (v) => (v >= 30 ? "30%+" : `${v}%`),
        endLabels: ["0%", "30%+"],
        scoreValue: (v) =>
          curve(v, [
            [0, 1],
            [5, 0.85],
            [10, 0.6],
            [15, 0.4],
            [20, 0.2],
            [30, 0],
          ]),
        unknown: {
          label: "I don't know",
          score: 0.3,
          gap: "You don't currently know your no-show rate, so the most expensive thing in your diary is happening unmeasured.",
          fix: {
            action:
              "Mark every missed or late-cancelled appointment for the next month. Two minutes a week gives you the number.",
            impact:
              "You'll see what no-shows are actually costing you, and whether reminders and deposits are working.",
            effort: "quick",
          },
        },
        review: (v) =>
          v <= 5
            ? { strength: `A ${v}% no-show rate is excellent - your diary is dependable.` }
            : {
                gap: `A ${v >= 30 ? "30%+" : `${v}%`} no-show rate means roughly one in ${Math.max(2, Math.round(100 / Math.max(v, 1)))} booked appointments earns nothing.`,
                fix: {
                  action: "Combine three things: a deposit at booking, two automated reminders, and a policy you actually enforce.",
                  impact: `Halving a ${v}% no-show rate is the equivalent of adding ${Math.round(v / 2)}% more bookings - without a single new enquiry.`,
                  effort: "quick",
                },
              },
      },
      {
        id: "policy",
        kind: "choice",
        prompt: "Do you have a cancellation policy that's enforced?",
        weight: 1.1,
        options: [
          {
            value: "always",
            label: "Yes - always enforced",
            score: 1,
            strength: "An enforced policy sets the standard, and clients respect a diary that's clearly valued.",
          },
          {
            value: "sometimes",
            label: "Yes - sometimes enforced",
            score: 0.55,
            gap: "Enforcing sometimes teaches clients the policy is negotiable, which quietly increases late cancellations.",
            fix: {
              action: "Apply the policy the same way every time, and let the booking confirmation do the explaining so you never have to.",
              impact: "Removes awkward conversations and reduces repeat offenders.",
              effort: "quick",
            },
          },
          {
            value: "unenforced",
            label: "There's a policy, but I don't enforce it",
            score: 0.3,
            gap: "An unenforced policy is the same as no policy, but it costs you the goodwill of the clients who do turn up on time.",
            fix: {
              action: "Attach the policy to a deposit so enforcement is automatic rather than a decision you have to make.",
              impact: "Protects your time without you having to chase anyone.",
              effort: "quick",
            },
          },
          {
            value: "none",
            label: "No policy",
            score: 0.1,
            gap: "With no cancellation policy, there's nothing to point to when someone cancels an hour before.",
            fix: {
              action: "Write a simple policy - 24 hours' notice, deposit retained otherwise - and show it at the point of booking.",
              impact: "Sets expectations up front and gives you a fair, unemotional way to protect your diary.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "noshow-followup",
        kind: "choice",
        prompt: "What happens when someone no-shows?",
        weight: 1,
        options: [
          {
            value: "auto",
            label: "An automated follow-up goes out",
            score: 1,
            strength: "No-shows are followed up automatically, so a missed appointment often becomes a rebooking rather than a lost client.",
          },
          {
            value: "manual",
            label: "I follow up manually",
            score: 0.7,
            strength: "You do follow up on missed appointments.",
            fix: {
              action: "Automate a same-day message that assumes the best and offers a rebooking link.",
              impact: "Recovers more no-shows and takes the awkwardness out of it.",
              effort: "quick",
            },
          },
          {
            value: "fee",
            label: "They're charged a fee",
            score: 0.8,
            strength: "Charging for missed appointments protects the value of your time.",
            fix: {
              action: "Pair the fee with a warm rebooking invitation so you protect the revenue and keep the client.",
              impact: "Keeps clients who'd otherwise be too embarrassed to come back.",
              effort: "quick",
            },
          },
          {
            value: "nothing",
            label: "Nothing",
            score: 0.1,
            gap: "No-shows disappear without a word, so you lose both the appointment and, usually, the client.",
            fix: {
              action: "Send a same-day, no-blame message with a link to rebook.",
              impact: "A good share of no-shows rebook when invited - that's revenue you currently write off.",
              effort: "quick",
            },
          },
        ],
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews & Reputation",
    shortTitle: "Reviews",
    context: "Your online reputation decides whether new clients trust you before they've met you.",
    why:
      "Reviews are the proof that makes every other part of your marketing work. They lift local search ranking, raise click-through and shorten the decision - and they're free.",
    weight: 1,
    verdict: {
      strong:
        "Your reputation is compounding. Reviews arrive consistently, you respond to them, and new clients arrive already trusting you.",
      ok:
        "You have reviews, but they arrive by chance rather than by system - so your reputation grows slower than your client list.",
      weak:
        "Your reviews don't reflect the quality of your work. Delighted clients are leaving without ever being asked, and new enquirers are judging you on a handful of old reviews.",
    },
    tools: [
      "An automatic review request sent a few hours after each appointment",
      "A direct Google review link saved as a short URL or QR code",
      "A monthly slot for replying to every review you've received",
    ],
    purpose: "Build proof that does the selling for you",
    kpi: {
      name: "Google reviews",
      metric: "How many reviews you have, and how fast new ones arrive",
      why: "Reviews decide who gets clicked before anyone speaks to you - and they lift every other channel you run.",
      supports: ["reviews", "retention", "confirmation"],
      current: (answers) => {
        const value = num(answers, "lead-sources.reviews-count");
        if (value === null) return null;
        return `${value >= 100 ? "100+" : value} review${value === 1 ? "" : "s"}`;
      },
      target: (answers) => {
        const value = num(answers, "lead-sources.reviews-count") ?? 0;
        return value >= 25 ? "10 new reviews a quarter, on autopilot" : "25 reviews, then 10 a quarter";
      },
      measure: {
        what: "Total reviews, new reviews this month, and your average rating.",
        where:
          "Google Business Profile. Write down the same three numbers for your two closest competitors while you're there - your count only matters relative to theirs.",
        cadence: "Monthly.",
      },
    },
    questions: [
      {
        id: "asking",
        kind: "choice",
        prompt: "How do you currently ask for reviews?",
        weight: 1.3,
        options: [
          {
            value: "auto",
            label: "An automated request goes out",
            score: 1,
            strength: "Review requests go out automatically, so your reputation grows with every client you see.",
          },
          {
            value: "manual",
            label: "I send a message manually",
            score: 0.6,
            strength: "You do ask for reviews personally, which usually gets a warm response.",
            fix: {
              action: "Automate the same message a few hours after each appointment, while the experience is still fresh.",
              impact: "Turns an occasional ask into a steady stream of new reviews.",
              effort: "quick",
            },
          },
          {
            value: "verbal",
            label: "I ask verbally",
            score: 0.35,
            gap: "Asking in person is easily forgotten once the client leaves, so most intentions never become reviews.",
            fix: {
              action: "Follow the verbal ask with an automatic message containing a direct review link - the link is what converts.",
              impact: "Typically multiplies the number of reviews you receive from the same conversations.",
              effort: "quick",
            },
          },
          {
            value: "none",
            label: "I don't really ask",
            score: 0.05,
            gap: "You aren't asking, so your review count reflects only the few clients motivated enough to do it unprompted.",
            fix: {
              action: "Send every client a short thank-you with a direct Google review link a few hours after their appointment.",
              impact: "Most businesses that start asking systematically double their review count within a quarter.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "review-rate",
        kind: "choice",
        prompt: "How often do clients leave a review after you ask?",
        weight: 1,
        options: [
          { value: "most", label: "Most do", score: 1, strength: "Your clients respond when asked, which means asking more is the whole strategy." },
          {
            value: "half",
            label: "About half",
            score: 0.75,
            strength: "A healthy share of clients leave a review when asked.",
            fix: {
              action: "Make the link one tap from the message and ask within a few hours of the appointment.",
              impact: "Small friction changes lift review rates significantly.",
              effort: "quick",
            },
          },
          {
            value: "rarely",
            label: "Rarely",
            score: 0.35,
            gap: "Few clients act on your review request, which usually means the ask arrives too late or takes too many steps.",
            fix: {
              action: "Send the request the same day, keep it to two sentences, and link straight to the review box.",
              impact: "Reviews per client typically rise sharply once the ask is immediate and one-click.",
              effort: "quick",
            },
          },
          {
            value: "never",
            label: "I don't ask",
            score: 0.05,
            gap: "Nobody is being asked, so reviews arrive only by accident.",
            fix: {
              action: "Add a same-day review request to your post-appointment follow-up.",
              impact: "Starts the compounding effect that makes local search work for you.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "responding",
        kind: "choice",
        prompt: "Do you respond to your Google reviews?",
        weight: 0.9,
        options: [
          { value: "all", label: "Yes - all of them", score: 1, strength: "Replying to every review signals care to future clients and helps your local ranking." },
          {
            value: "none-yet",
            label: "I don't have any reviews yet",
            score: 0.15,
            gap: "You have no reviews to respond to yet, which means new clients have nothing to reassure them before they enquire.",
            fix: {
              action:
                "Ask your ten most recent happy clients directly this week, with a link straight to the review box. Then automate the same request for everyone who follows.",
              impact:
                "Your first ten reviews change how every other part of your marketing performs - they're the proof everything else relies on.",
              effort: "quick",
            },
          },
          {
            value: "most",
            label: "Most",
            score: 0.75,
            strength: "You reply to most reviews.",
            fix: {
              action: "Set a recurring 15-minute slot each month to clear the rest.",
              impact: "Complete response rates read as a business that's paying attention.",
              effort: "quick",
            },
          },
          {
            value: "rarely",
            label: "Rarely",
            score: 0.35,
            gap: "Most reviews go unanswered, which makes an otherwise glowing profile look neglected.",
            fix: {
              action: "Reply to every review - two warm sentences is plenty, and mention the treatment by name.",
              impact: "Improves how your profile reads to new clients and supports local search visibility.",
              effort: "quick",
            },
          },
          {
            value: "never",
            label: "Never",
            score: 0.15,
            gap: "No replies at all, so clients who took the time to praise you got silence - and future clients can see it.",
            fix: {
              action: "Work back through your existing reviews and reply to each one, then keep on top of new ones monthly.",
              impact: "An afternoon's work that visibly improves your most-viewed public page.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "competitors",
        kind: "choice",
        prompt: "How does your review count compare with local competitors?",
        weight: 0.9,
        options: [
          { value: "more", label: "More than most", score: 1, strength: "You out-review your local competitors, which wins you the click before anyone speaks to you." },
          {
            value: "same",
            label: "About the same",
            score: 0.6,
            gap: "You're level with competitors, so reviews aren't yet a reason to choose you.",
            fix: {
              action: "Set a target of 10 new reviews a quarter through an automated request - enough to move you clearly ahead.",
              impact: "Being visibly the best-reviewed option locally shortens the decision for new clients.",
              effort: "quick",
            },
          },
          {
            value: "fewer",
            label: "Fewer",
            score: 0.25,
            gap: "Competitors have more reviews than you, so you're losing clients at the comparison stage - before they ever contact you.",
            fix: {
              action: "Automate review requests for every client and ask your loyal regulars directly this month.",
              impact: "Closing the review gap is usually the fastest way to win more of the local search traffic you already appear in.",
              effort: "quick",
            },
          },
          {
            value: "unknown",
            label: "I don't know",
            score: 0.35,
            gap: "You don't know where you stand locally, so you can't tell whether reputation is helping or costing you.",
            fix: {
              action: "Search your main treatment plus your town, and note the review counts of the top three results.",
              impact: "Gives you a concrete target instead of a vague intention.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "review-blocker",
        kind: "text",
        prompt: "What's stopping you from getting more reviews?",
        hint: "In your own words - this shapes the recommendations in your report.",
        weight: 0,
        placeholder: "e.g. I feel awkward asking, or I never remember once the client has left…",
        optional: true,
      },
    ],
  },
  {
    id: "retention",
    title: "Retention & Re-engagement",
    shortTitle: "Retention",
    context: "Keeping existing clients is far cheaper than finding new ones.",
    why:
      "Retention is where the profit lives. A client who rebooks costs you nothing to win, spends more over time, and refers people who trust you before they arrive.",
    weight: 1.2,
    verdict: {
      strong:
        "Clients come back, and coming back is built into how you work rather than left to chance. That's the most profitable position a business like yours can be in.",
      ok:
        "You keep a good share of clients, but rebooking depends on them remembering you rather than on a system. There's real profit sitting in that gap.",
      weak:
        "You're refilling your diary from scratch every month. Fixing retention is usually the fastest route to higher income without more marketing, more hours or more enquiries.",
    },
    tools: [
      "Rebooking prompted before the client leaves the room",
      "An automated 'we've missed you' sequence at 8–12 weeks",
      "A simple referral reward for existing clients",
    ],
    purpose: "Turn first visits into regulars",
    kpi: {
      name: "Repeat client rate",
      metric: "The share of your appointments taken by clients who've been before",
      why: "Returning clients cost nothing to win, so this number goes almost straight to profit - and it steadies the quiet weeks.",
      supports: ["retention", "reviews", "confirmation"],
      current: (answers) => {
        const value = num(answers, "retention.repeat-rate");
        return value === null ? null : `${value}% repeat`;
      },
      target: (answers) => {
        const value = num(answers, "retention.repeat-rate");
        if (value === null) return "Measured first, then 60%+";
        return `${Math.min(Math.max(value + 20, 60), 85)}% repeat`;
      },
      measure: {
        what:
          "The share of appointments taken by clients who have been before, and the share who rebook before they leave.",
        where:
          "Your booking system's client report - new against returning. For rebooking, count it yourself for a fortnight: it's the number in-room habits move fastest.",
        cadence: "Monthly for repeat rate, fortnightly when you're actively working on rebooking.",
      },
    },
    questions: [
      {
        id: "client-value",
        kind: "choice",
        prompt: "Roughly what is one new client worth to you, over the whole time they stay with you?",
        hint: "Their spend per visit × visits a year × the years they stay. A rough band is fine - it's what makes the rest of this report add up in pounds rather than percentages.",
        // Context, not performance: this shapes the report but never the score.
        weight: 0,
        options: [
          { value: "under-250", label: "Under £250 - a visit or two and they move on", score: 1 },
          { value: "250-500", label: "£250 – £500", score: 1 },
          { value: "500-1000", label: "£500 – £1,000 - a regular for around a year", score: 1 },
          { value: "1000-2500", label: "£1,000 – £2,500", score: 1 },
          { value: "2500-5000", label: "£2,500 – £5,000 - a loyal client over several years", score: 1 },
          { value: "5000-plus", label: "More than £5,000", score: 1 },
          {
            value: "unknown",
            label: "I don't know",
            score: 1,
            gap: "You don't yet know what a client is worth over their lifetime, so there's no way to judge what any gap in this journey is actually costing you.",
            fix: {
              action:
                "Work out a rough figure: average spend per visit × visits per year × the number of years a typical client stays. A rough number beats no number.",
              impact:
                "Once you know it, every decision - deposits, follow-up, an hour spent on reviews - can be judged against what it returns.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "post-appointment",
        kind: "choice",
        prompt: "After an appointment, what happens next?",
        weight: 1.4,
        options: [
          {
            value: "rebook",
            label: "They're prompted to rebook before leaving",
            score: 1,
            strength: "Rebooking before they leave is the single most effective retention habit there is - and you already do it.",
          },
          {
            value: "followup",
            label: "A follow-up message goes out",
            score: 0.7,
            strength: "You follow up after appointments, which keeps the relationship warm.",
            fix: {
              action: "Add a rebooking prompt in the room, before they leave, as well as the follow-up.",
              impact: "In-room rebooking typically converts several times better than any message sent later.",
              effort: "quick",
            },
          },
          {
            value: "sequence",
            label: "A re-engagement sequence runs",
            score: 0.85,
            strength: "An automated sequence keeps you present between appointments.",
            fix: {
              action: "Pair the sequence with an in-room rebooking prompt so the easiest conversion happens first.",
              impact: "Fills more of your diary in advance and smooths out quiet weeks.",
              effort: "quick",
            },
          },
          {
            value: "nothing",
            label: "Nothing",
            score: 0.05,
            gap: "Once a client leaves, there's nothing bringing them back - so every month you start again on new enquiries.",
            fix: {
              action: "Do two things: ask every client to rebook before they leave, and send a follow-up message the next day.",
              impact:
                "Retention improvements go almost entirely to profit, because there's no acquisition cost attached.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "repeat-rate",
        kind: "slider",
        prompt: "What percentage of your clients are repeat rather than new?",
        weight: 1.2,
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 40,
        unit: "% repeat",
        endLabels: ["All new", "All repeat"],
        scoreValue: (v) =>
          curve(v, [
            [0, 0],
            [20, 0.3],
            [40, 0.55],
            [60, 0.8],
            [80, 1],
          ]),
        review: (v) =>
          v >= 60
            ? { strength: `${v}% of your clients are returning, which means your diary has a dependable base under it.` }
            : {
                gap: `Only ${v}% of your clients are repeat, so most of your income depends on constantly finding new people.`,
                fix: {
                  action: "Prompt every client to rebook before they leave, and set up a re-engagement message for anyone who hasn't been back in 10 weeks.",
                  impact: `Lifting repeat business from ${v}% to ${Math.min(v + 20, 85)}% would meaningfully raise your income without a single new enquiry.`,
                  effort: "project",
                },
              },
      },
      {
        id: "reengagement",
        kind: "choice",
        prompt: "Do you have a system to re-engage clients who haven't been back in a while?",
        weight: 1.1,
        options: [
          {
            value: "auto",
            label: "Yes - automated",
            score: 1,
            strength: "Lapsed clients are contacted automatically, so quiet weeks get filled from people who already trust you.",
          },
          {
            value: "manual",
            label: "Yes - manually",
            score: 0.6,
            strength: "You do reach out to clients who've drifted.",
            fix: {
              action: "Automate it on a 10-week trigger so it happens even in the weeks you're flat out.",
              impact: "Turns an occasional effort into a reliable source of rebookings.",
              effort: "project",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.05,
            gap: "Clients who drift away are never contacted, so a growing list of people who liked your work is going unused.",
            fix: {
              action: "Export clients who haven't visited in 10+ weeks and send a short, warm message with a rebooking link. Then automate it.",
              impact: "This is usually the quickest available win - the clients already know and trust you.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "referral",
        kind: "choice",
        prompt: "Do you have a referral programme?",
        weight: 0.9,
        options: [
          { value: "formal", label: "Yes - a formal one", score: 1, strength: "A structured referral programme turns happy clients into a steady, no-cost source of new ones." },
          {
            value: "informal",
            label: "Informal - word of mouth",
            score: 0.55,
            gap: "Referrals happen by accident rather than because you've made them easy and rewarding.",
            fix: {
              action: "Offer a simple two-way reward - something for the client who refers and something for the friend - and mention it in your follow-up message.",
              impact: "Makes your best clients your most cost-effective marketing channel.",
              effort: "quick",
            },
          },
          {
            value: "no",
            label: "No",
            score: 0.2,
            gap: "There's no referral programme, so the trust you've built with existing clients isn't bringing new ones in.",
            fix: {
              action: "Launch a simple referral reward and tell every client about it after their appointment.",
              impact: "Referred clients convert faster, spend more and stay longer than any other source.",
              effort: "quick",
            },
          },
        ],
      },
      {
        id: "retention-rating",
        kind: "scale",
        prompt: "How would you rate your client retention?",
        weight: 0.8,
        lowLabel: "Very poor",
        highLabel: "Excellent",
        review: (v) =>
          v >= 4
            ? { strength: "You rate your retention highly, and returning clients are the most profitable revenue you have." }
            : {
                gap: "You know retention isn't where it should be - which means you're paying to replace clients you could have kept.",
                fix: {
                  action: "Start with rebooking in the room, then add a 10-week re-engagement message for anyone who slips through.",
                  impact: "Retention gains flow almost straight to profit.",
                  effort: "quick",
                },
              },
      },
    ],
  },
];

export const SECTION_COUNT = SECTIONS.length;

/*
  Two numbers that aren't scored, asked once the eight stages are done. They're
  what turns "your nurture is weak" into "that's roughly £4,000 a year", which
  is the difference between an interesting score and an urgent one.
*/
export const NUMBERS_QUESTIONS: Question[] = [
  {
    id: "appointments",
    kind: "slider",
    prompt: "Roughly how many client appointments do you have in a typical week?",
    weight: 0,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 20,
    format: (v) => (v >= 100 ? "100+" : String(v)),
    endLabels: ["None", "100+"],
    scoreValue: () => 0,
  },
  {
    id: "value",
    kind: "slider",
    prompt: "What's your average appointment value?",
    hint: "A rough average across everything you offer is fine.",
    weight: 0,
    min: 0,
    max: 300,
    step: 5,
    defaultValue: 60,
    format: (v) => (v >= 300 ? "£300+" : `£${v}`),
    endLabels: ["£0", "£300+"],
    scoreValue: () => 0,
  },
];

export const NUMBERS_KEYS = {
  appointments: "numbers.appointments",
  value: "numbers.value",
} as const;
