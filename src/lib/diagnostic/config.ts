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
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://calendly.com/tulivodigital/15min",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "jemina@tulivodigital.com",
  consultant: "Jemina Semakula",
  company: "Tulivo Digital",
  website: process.env.NEXT_PUBLIC_SITE_URL ?? "tulivodigital.com",
  reportPages: 14,
  offers: [
    {
      name: "Self-implement",
      price: "Included",
      description:
        "Work through your report in order. Start with the quick wins, then your first 30 days. Everything is written so you can action it without help.",
    },
    {
      name: "Intensive Day",
      price: "From £1,500",
      description:
        "One focused day together fixing your number one priority end to end — built, tested and live before we finish.",
    },
    {
      name: "90-Day Growth Advisory",
      price: "From £6,000",
      description:
        "Full implementation of your action plan across all three priorities, with fortnightly sessions and everything built with you.",
    },
  ],
} as const;
