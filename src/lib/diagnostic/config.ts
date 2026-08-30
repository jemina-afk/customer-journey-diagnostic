/*
  Everything Jemina might want to change without touching components. All the
  public values are read at build time from NEXT_PUBLIC_* env vars, with
  sensible defaults so the diagnostic works out of the box.
*/

export const DIAGNOSTIC = {
  price: process.env.NEXT_PUBLIC_DIAGNOSTIC_PRICE ?? "297",
  currencySymbol: "£",
  /** Stan Store / external checkout, used when Stripe isn't configured. */
  checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "",
  /*
    Until a way to take money is configured, the unlock button simply unlocks -
    otherwise the report can't be tested at all. Set NEXT_PUBLIC_REQUIRE_PAYMENT
    to "true" to keep it locked even then.
  */
  requirePayment: process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === "true",
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://calendly.com/tulivodigital/15min",
  /** How long the free call is, in minutes. Used everywhere it's mentioned. */
  callMinutes: Number(process.env.NEXT_PUBLIC_CALL_MINUTES ?? 15),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "jemina@tulivodigital.com",
  consultant: "Jemina Semakula",
  company: "Tulivo Digital",
  website: process.env.NEXT_PUBLIC_SITE_URL ?? "tulivodigital.com",
  reportPages: 15,
  /** Written out for the sign-in screen, e.g. "twice in any 30 days". */
  runsPerWindowLabel: `${
    Number(process.env.NEXT_PUBLIC_RUNS_PER_WINDOW ?? 2) === 2
      ? "twice"
      : `${Number(process.env.NEXT_PUBLIC_RUNS_PER_WINDOW ?? 2)} times`
  } in any ${Number(process.env.NEXT_PUBLIC_WINDOW_DAYS ?? 30)} days`,
  /*
    Two ways to unlock. The report on its own is priced to be an easy yes; the
    call is the one that matters, because it puts a paying, pre-qualified owner
    in front of Jemina with their own gaps already read.
  */
  tiers: [
    {
      id: "report",
      name: "The full report",
      price: Number(process.env.NEXT_PUBLIC_TIER_REPORT_PRICE ?? 297),
      blurb: "Everything unlocked on screen, plus the PDF to keep.",
      features: [
        "Exactly what's broken in each of the eight stages",
        "Specific recommendations written from your answers",
        "Your 90-day focus KPI and aligned priorities",
        "Quick wins you can implement this week",
        `The ${Number(process.env.NEXT_PUBLIC_REPORT_PAGES ?? 15)}-page PDF report`,
      ],
      recommended: false,
    },
    {
      id: "call",
      name: "Report + walkthrough call",
      price: Number(process.env.NEXT_PUBLIC_TIER_CALL_PRICE ?? 497),
      blurb: "Everything above, plus 45 minutes with Jemina to agree your focus.",
      features: [
        "Everything in the full report",
        "A 45-minute walkthrough of your results",
        "Your focus KPI and 90-day priorities agreed together",
        "The two things to do first, decided on the call",
        "A recording and written summary afterwards",
      ],
      recommended: true,
    },
  ],
  offers: [
    {
      name: "Run it yourself",
      price: "Included",
      description:
        "The whole cycle is written out for you to work through in order. Be warned that it is a fair amount of work: three months of building, testing and following up around an already full diary, and the parts you're least sure about are usually the ones that slip.",
      emphasis: false,
    },
    {
      name: "Intensive Day",
      price: "From £1,500",
      description:
        "One day together on the first priority in your cycle, built and switched on before we finish. You approve the work rather than research it, and you end the day with something live instead of something planned.",
      emphasis: true,
    },
    {
      name: "LEAP - 90-Day Sprint",
      price: "From £6,000",
      description:
        "The same cycle, built with you across ninety days: your focus KPI, the aligned priorities, fortnightly sessions, and the work shared rather than left to your evenings. Your number gets looked at every two weeks, which is usually what separates a plan that happens from one that doesn't.",
      emphasis: true,
    },
  ],
} as const;
