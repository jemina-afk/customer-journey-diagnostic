import { DEFAULT_CURRENCY, money, type Currency } from "./currency";
import { NUMBERS_KEYS } from "./sections";
import { clientValueOf } from "./scoring";
import { SECTIONS } from "./sections";
import { UNKNOWN } from "./types";
import type { Answers, Section } from "./types";

/*
  What the gaps are worth in money.

  Deliberately conservative: every figure is built from numbers they gave us,
  each one is capped so a single answer can't produce a silly headline, and the
  assumptions are carried alongside the result so they can be shown on screen.
  The aim is a number they recognise as theirs, not the biggest number possible.
*/

/** Appointments happen ~50 weeks a year once holidays and quiet spells are out. */
const WORKING_WEEKS = 50;

/* The whole estimate is held to this share of revenue. Fifteen per cent is
   what a first cycle can credibly recover; anything louder stops sounding like
   an estimate and starts sounding like a sales figure. */
export const TOTAL_CAP = 0.15;

export interface Leak {
  id: string;
  /** The stage this cost belongs to. */
  stageId: string;
  label: string;
  /** Recoverable pounds a year, rounded. */
  annual: number;
  /** The reasoning, in one line. */
  basis: string;
}

export interface Impact {
  /** False when we couldn't estimate - the UI then says nothing about money. */
  available: boolean;
  appointmentsPerWeek: number;
  averageValue: number;
  annualRevenue: number;
  leaks: Leak[];
  /** Total recoverable a year, rounded. */
  recoverable: number;
  assumptions: string[];
}

/** "an 18%", "a 12%" - small thing, but it's the difference between written and generated. */
function article(value: number): string {
  const spoken = String(value);
  return spoken.startsWith("8") || spoken.startsWith("11") || spoken.startsWith("18") ? "an" : "a";
}

/** Never let a capped figure read as a precise one. */
function round(value: number): number {
  if (value >= 1000) return Math.round(value / 100) * 100;
  return Math.round(value / 10) * 10;
}

/*
  Every stage can carry a cost, not only the three we happen to have a measured
  number for. A stage scoring 10 out of 100 with no figure beside it was the
  clearest bug in the last version: the reader can see it is broken, and the
  report said nothing about what it was worth.

  So each stage gets a line. Where they gave us the number - the no-show rate,
  the conversion rate, the repeat rate - the figure is worked from it and the
  basis says so. Where they did not, the figure is the share of revenue that
  depends on the stage, multiplied by how far short of working it is, halved,
  because half a gap is what a first cycle realistically closes.

  Everything is then scaled so the total stays inside the cap. Scaling the
  whole set rather than clipping the top of it keeps the parts adding up to the
  headline, which is the first thing a careful reader checks.
*/
function stageShare(section: Section, sections: Section[]): number {
  const total = sections.reduce((sum, s) => sum + s.weight, 0);
  return total > 0 ? section.weight / total : 1 / sections.length;
}

export function estimateImpact(
  answers: Answers,
  currency: Currency = DEFAULT_CURRENCY,
  /** Their overall score. Kept for callers that still pass it; unused now the
   *  cap is a flat share of revenue. */
  overall?: number,
  /** Scored stages, so every weak one can carry a figure. */
  scored?: { id: string; title: string; score: number }[],
): Impact {
  void overall;
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

  const assumptions = [
    `${perWeek} appointment${perWeek === 1 ? "" : "s"} a week at ${money(value, currency)}, over ${WORKING_WEEKS} working weeks.`,
  ];

  const scoreOf = (id: string) => scored?.find((s) => s.id === id)?.score ?? null;
  const titleOf = (id: string) =>
    scored?.find((s) => s.id === id)?.title ??
    SECTIONS.find((s) => s.id === id)?.title ??
    id;

  /* ------------------------------------------- the measured figures first */

  const measured = new Map<string, { annual: number; label: string; basis: string }>();

  const noShow = answers["reminders.noshow-rate"];
  const noShowRate = typeof noShow === "number" ? noShow / 100 : noShow === UNKNOWN ? 0.1 : null;
  if (noShowRate !== null && noShowRate > 0) {
    measured.set("reminders", {
      annual: bookings * noShowRate * value * 0.5,
      label: "Appointments that don't turn up",
      basis:
        noShow === UNKNOWN
          ? "Assumes a 10% no-show rate, since you don't track it yet, and that half of those are winnable."
          : `Halving ${article(Math.round(noShowRate * 100))} ${Math.round(noShowRate * 100)}% no-show rate.`,
    });
    if (noShow === UNKNOWN) assumptions.push("A 10% no-show rate, as a sector-typical placeholder.");
  }

  const conversion = answers["lead-nurture.conversion-rate"];
  const repeat = answers["retention.repeat-rate"];
  if (typeof conversion === "number" && conversion >= 5 && conversion < 70) {
    const lifetime = clientValueOf(answers, currency);
    /*
      Working back to how many enquiries this business actually gets.
      Appointments aren't clients: a client who visits monthly is one enquiry,
      not twelve. How often they visit falls out of what they told us.
    */
    const visitsPerYear = lifetime
      ? Math.min(Math.max(lifetime.midpoint / value / 2, 1), 24)
      : 4;
    const repeatShare = typeof repeat === "number" ? Math.min(repeat, 90) / 100 : 0.5;
    const newClients = (bookings / visitsPerYear) * Math.max(1 - repeatShare, 0.1);
    const enquiries = newClients / (conversion / 100);
    const lift = Math.min(10, 70 - conversion) / 100;
    const perClient = lifetime ? Math.max(lifetime.midpoint / 2, value) : value;
    measured.set("lead-nurture", {
      annual: enquiries * lift * perClient,
      label: "Enquiries that never became clients",
      basis: lifetime
        ? `Taking conversion from ${conversion}% to ${conversion + Math.round(lift * 100)}%, counting half of ${lifetime.label} per client in the first year.`
        : `Taking enquiry-to-client conversion from ${conversion}% to ${conversion + Math.round(lift * 100)}%.`,
    });
  }

  if (typeof repeat === "number" && repeat < 60) {
    // At most ten points, which is what a quarter of rebooking work moves.
    const gap = Math.min(10, 60 - repeat) / 100;
    measured.set("retention", {
      annual: bookings * gap * 0.5 * value,
      label: "Clients who don't come back",
      basis: `Taking repeat business from ${repeat}% to ${repeat + Math.round(gap * 100)}%, and counting half of that.`,
    });
  }

  /* ------------------------------- then a line for every stage that is weak */

  const raw: (Leak & { raw: number })[] = [];

  SECTIONS.forEach((section) => {
    const score = scoreOf(section.id);
    const hit = measured.get(section.id);
    const weak = score !== null && score < 50;

    if (!hit && !weak) return;

    const amount = hit
      ? hit.annual
      : revenue * stageShare(section, SECTIONS) * ((100 - (score ?? 50)) / 100) * 0.5;

    if (amount <= 0) return;
    raw.push({
      id: section.id,
      stageId: section.id,
      label: hit?.label ?? `${titleOf(section.id)}: what the gap costs`,
      annual: amount,
      raw: amount,
      basis:
        hit?.basis ??
        `${section.title} scored ${score} out of 100. This is half of the share of your revenue that depends on this stage working.`,
    });
  });

  /* ------------------------------------------ hold the total to the cap */

  const rawTotal = raw.reduce((sum, leak) => sum + leak.raw, 0);
  const ceiling = revenue * TOTAL_CAP;
  const scale = rawTotal > ceiling && rawTotal > 0 ? ceiling / rawTotal : 1;

  const leaks: Leak[] = raw
    .map((leak) => ({
      id: leak.id,
      stageId: leak.stageId,
      label: leak.label,
      annual: round(leak.raw * scale),
      basis: scale < 1 ? `${leak.basis} Held inside a conservative share of your revenue.` : leak.basis,
    }))
    .filter((leak) => leak.annual > 0)
    .sort((a, b) => b.annual - a.annual);

  const total = leaks.reduce((sum, leak) => sum + leak.annual, 0);

  return {
    available: leaks.length > 0 && total >= 250,
    appointmentsPerWeek: perWeek,
    averageValue: value,
    annualRevenue: round(revenue),
    leaks,
    recoverable: total,
    assumptions,
  };
}

function numberAnswer(answers: Answers, key: string): number | null {
  const value = answers[key];
  return typeof value === "number" && value > 0 ? value : null;
}

export function formatMoney(value: number, currency: Currency = DEFAULT_CURRENCY): string {
  return money(value, currency);
}
