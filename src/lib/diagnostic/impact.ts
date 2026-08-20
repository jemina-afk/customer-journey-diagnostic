import { NUMBERS_KEYS } from "./sections";
import { clientValueOf } from "./scoring";
import { UNKNOWN } from "./types";
import type { Answers } from "./types";

/*
  What the gaps are worth in money.

  Deliberately conservative: every figure is built from numbers they gave us,
  each one is capped so a single answer can't produce a silly headline, and the
  assumptions are carried alongside the result so they can be shown on screen.
  The aim is a number they recognise as theirs, not the biggest number possible.
*/

/** Appointments happen ~50 weeks a year once holidays and quiet spells are out. */
const WORKING_WEEKS = 50;

/** No single leak may claim more than this share of annual revenue. */
const PER_LEAK_CAP = 0.18;
/** Nor may the total. */
const TOTAL_CAP = 0.35;

export interface Leak {
  id: string;
  label: string;
  /** Recoverable pounds a year, rounded. */
  annual: number;
  /** The reasoning, in one line. */
  basis: string;
}

export interface Impact {
  /** False when we couldn't estimate — the UI then says nothing about money. */
  available: boolean;
  appointmentsPerWeek: number;
  averageValue: number;
  annualRevenue: number;
  leaks: Leak[];
  /** Total recoverable a year, rounded. */
  recoverable: number;
  assumptions: string[];
}

/** "an 18%", "a 12%" — small thing, but it's the difference between written and generated. */
function article(value: number): string {
  const spoken = String(value);
  return spoken.startsWith("8") || spoken.startsWith("11") || spoken.startsWith("18") ? "an" : "a";
}

function round(value: number): number {
  if (value >= 1000) return Math.round(value / 100) * 100;
  return Math.round(value / 10) * 10;
}

export function estimateImpact(answers: Answers): Impact {
  const perWeek = numberAnswer(answers, NUMBERS_KEYS.appointments);
  const value = numberAnswer(answers, NUMBERS_KEYS.value);

  const empty: Impact = {
    available: false,
    appointmentsPerWeek: perWeek ?? 0,
    averageValue: value ?? 0,
    annualRevenue: 0,
    leaks: [],
    recoverable: 0,
    assumptions: [],
  };
  if (!perWeek || !value) return empty;

  const bookings = perWeek * WORKING_WEEKS;
  const revenue = bookings * value;
  if (revenue <= 0) return empty;

  const cap = revenue * PER_LEAK_CAP;
  const leaks: Leak[] = [];
  const assumptions = [
    `${perWeek} appointment${perWeek === 1 ? "" : "s"} a week at £${value}, over ${WORKING_WEEKS} working weeks.`,
  ];

  // 1. Missed appointments — half of them are winnable with reminders,
  //    deposits and an enforced policy.
  const noShow = answers["reminders.noshow-rate"];
  const noShowRate = typeof noShow === "number" ? noShow / 100 : noShow === UNKNOWN ? 0.1 : null;
  if (noShowRate !== null && noShowRate > 0) {
    const recoverable = Math.min(bookings * noShowRate * value * 0.5, cap);
    if (recoverable >= 100) {
      leaks.push({
        id: "no-shows",
        label: "Appointments that don't turn up",
        annual: round(recoverable),
        basis:
          noShow === UNKNOWN
            ? "Assumes a 10% no-show rate, since you don't track it yet, and that half of those are winnable."
            : `Halving ${article(Math.round(noShowRate * 100))} ${Math.round(noShowRate * 100)}% no-show rate.`,
      });
      if (noShow === UNKNOWN) assumptions.push("A 10% no-show rate, as a sector-typical placeholder.");
    }
  }

  // 2. Enquiries that never book — a 10-point lift is a realistic first move.
  const conversion = answers["lead-nurture.conversion-rate"];
  if (typeof conversion === "number" && conversion >= 5 && conversion < 70) {
    const enquiries = bookings / (conversion / 100);
    const lift = Math.min(10, 70 - conversion) / 100;
    // A won enquiry is worth what the client is worth over time, where they
    // told us; one appointment is the conservative floor where they didn't.
    const lifetime = clientValueOf(answers);
    const perClient = lifetime ? Math.max(lifetime.midpoint, value) : value;
    const recoverable = Math.min(enquiries * lift * perClient, cap);
    if (recoverable >= 100) {
      leaks.push({
        id: "enquiries",
        label: "Enquiries that never became clients",
        annual: round(recoverable),
        basis: lifetime
          ? `Taking conversion from ${conversion}% to ${conversion + Math.round(lift * 100)}%, at ${lifetime.label} per client.`
          : `Taking enquiry-to-client conversion from ${conversion}% to ${conversion + Math.round(lift * 100)}%.`,
      });
    }
  }

  // 3. Clients who don't come back — closing part of the gap to a 60% repeat rate.
  const repeat = answers["retention.repeat-rate"];
  if (typeof repeat === "number" && repeat < 60) {
    const gap = Math.min(60 - repeat, 20) / 100;
    const recoverable = Math.min(bookings * gap * 0.5 * value, cap);
    if (recoverable >= 100) {
      leaks.push({
        id: "retention",
        label: "Clients who don't come back",
        annual: round(recoverable),
        basis: `Closing half the gap between ${repeat}% repeat business and 60%.`,
      });
    }
  }

  const total = Math.min(
    leaks.reduce((sum, leak) => sum + leak.annual, 0),
    revenue * TOTAL_CAP,
  );

  return {
    available: leaks.length > 0 && total >= 250,
    appointmentsPerWeek: perWeek,
    averageValue: value,
    annualRevenue: round(revenue),
    leaks: leaks.sort((a, b) => b.annual - a.annual),
    recoverable: round(total),
    assumptions,
  };
}

function numberAnswer(answers: Answers, key: string): number | null {
  const value = answers[key];
  return typeof value === "number" && value > 0 ? value : null;
}

export function formatMoney(value: number): string {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}
