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
    Until a way to take money is configured, the unlock button simply unlocks —
    otherwise the report can't be tested at all. Set NEXT_PUBLIC_REQUIRE_PAYMENT
    to "true" to keep it locked even then.
  */
  requirePayment: process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === "true",
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://calendly.com/tulivodigital/15min",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "jemina@tulivodigital.com",
  consultant: "Jemina Semakula",
  company: "Tulivo Digital",
  website: process.env.NEXT_PUBLIC_SITE_URL ?? "tulivodigital.com",
  reportPages: 14,
  /*
    Two ways to unlock. The report on its own is priced to be an easy yes; the
    call is the one that matters, because it puts a paying, pre-qualified owner
    in front of Jemina with their own gaps already read.
  */
  tiers: [
    {
      id: "report",
      name: "The full report",
      price: Number(process.env.NEXT_PUBLIC_TIER_REPORT_PRICE ?? 97),
      blurb: "Everything unlocked on screen, plus the PDF to keep.",
      features: [
        "Exactly what's broken in each of the eight stages",
        "Specific recommendations written from your answers",
        "Your 90-day focus KPI and aligned priorities",
        "Quick wins you can implement this week",
        "The 14-page PDF report",
      ],
      recommended: false,
    },
    {
      id: "call",
      name: "Report + walkthrough call",
      price: Number(process.env.NEXT_PUBLIC_TIER_CALL_PRICE ?? 397),
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
      name: "Self-implement",
      price: "Included",
      description:
        "Work through your report in order. Start with the quick wins, then your focus KPI and its priorities. Everything is written so you can action it without help.",
    },
    {
      name: "Intensive Day",
      price: "From £1,500",
      description:
        "One focused day together fixing the first priority in your cycle end to end — built, tested and live before we finish.",
    },
    {
      name: "LEAP — 90-Day Growth Advisory",
      price: "From £6,000",
      description:
        "One KPI, three or four aligned priorities, ninety days, built with you. When the number moves, the next cycle takes on the next KPI.",
    },
  ],
} as const;
