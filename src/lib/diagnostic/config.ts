/*
  Everything Jemina might want to change without touching components. All the
  public values are read at build time from NEXT_PUBLIC_* env vars, with
  sensible defaults so the diagnostic works out of the box.
*/

export const DIAGNOSTIC = {
  price: process.env.NEXT_PUBLIC_DIAGNOSTIC_PRICE ?? "97",
  currencySymbol: "£",
  /** Stan Store / external checkout, used when Stripe isn't configured. */
  checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "",
  /*
    While no way to take money is configured, the report opens on its own and
    the results page shows a toggle between the open and closed views, so both
    can be read and edited. There is nothing to protect yet: with no Stripe key
    and no checkout URL, nobody could pay even if they wanted to.

    Two things close it again, and either is enough. Connecting Stripe or a
    checkout URL ends it automatically. Setting NEXT_PUBLIC_REQUIRE_PAYMENT to
    "true" ends it now, whatever else is configured.
  */
  requirePayment: process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === "true",
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://calendly.com/tulivodigital/15min",
  /** How long the free call is, in minutes. Used everywhere it's mentioned. */
  callMinutes: Number(process.env.NEXT_PUBLIC_CALL_MINUTES ?? 15),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "jemina@tulivodigital.com",
  consultant: "Jemina Semakula",
  company: "Tulivo Digital",
  website: process.env.NEXT_PUBLIC_SITE_URL ?? "tulivodigital.com",
  reportPages: 26,
  /** Written out for the sign-in screen, e.g. "twice in any 30 days". */
  runsPerWindowLabel: `${
    Number(process.env.NEXT_PUBLIC_RUNS_PER_WINDOW ?? 2) === 2
      ? "twice"
      : `${Number(process.env.NEXT_PUBLIC_RUNS_PER_WINDOW ?? 2)} times`
  } in any ${Number(process.env.NEXT_PUBLIC_WINDOW_DAYS ?? 30)} days`,
  /*
    One way to unlock. The report is priced to be an easy yes, and the £97 is
    set against the gap it finds; the walkthrough call is free afterwards,
    because a paying owner reading their own gaps is the conversation worth
    having.
  */
  tiers: [
    {
      id: "report",
      name: "Your full report",
      price: Number(process.env.NEXT_PUBLIC_TIER_REPORT_PRICE ?? 97),
      blurb: `Everything unlocked on screen, plus a ${Number(process.env.NEXT_PUBLIC_REPORT_PAGES ?? 16)}-page PDF to keep.`,
      features: [
        "Exactly what's broken in each of the eight stages",
        "Specific recommendations written from your answers",
        "Your 90-day focus and the priorities that move it",
        "Quick wins you can switch on this week",
      ],
      recommended: false,
    },
  ],
  offers: [
    {
      name: "Run it yourself",
      price: "Included",
      description:
        "The whole cycle is written out for you to work through in order. Be warned that it is a fair amount of work: three months of building, testing and following up around an already full diary, and the parts you're least sure about are usually the ones that slip.",
      emphasis: false,
      label: "",
    },
    {
      name: "Your top priority, built for you",
      price: "From £950",
      description:
        "We take the gap that's costing you most and build the fix properly, so it runs without you remembering to do it. Any quick wins that sit alongside it are included in the build.",
      emphasis: true,
      label: "Built with you",
    },
    {
      name: "LEAP - 90-Day Sprint",
      price: "From £2,500 a month",
      description:
        "The same cycle, built with you across ninety days: your focus KPI, the aligned priorities, fortnightly sessions, and the work shared rather than left to your evenings. Your number gets looked at every two weeks, which is usually what separates a plan that happens from one that doesn't.",
      emphasis: true,
      label: "Built with you",
    },
  ],
} as const;
