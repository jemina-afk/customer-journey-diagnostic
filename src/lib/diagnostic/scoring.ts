import { SECTIONS } from "./sections";
import { estimateImpact } from "./impact";
import { UNKNOWN } from "./types";
import type {
  Answers,
  CyclePriority,
  FocusCycle,
  ClientValue,
  AnswerValue,
  Band,
  DiagnosticResult,
  Fix,
  Question,
  Section,
  SectionResult,
  Status,
} from "./types";

/*
  Turns raw answers into scores, findings and a prioritised plan. Pure and
  deterministic - the browser, the PDF and the server all call the same code.
*/

export const BANDS: Record<Band, { label: string; summary: string; range: [number, number] }> = {
  optimised: {
    label: "Optimised",
    summary:
      "Your journey is solid. The foundations are in place, so fine-tuning is what brings the next gains - not rebuilding.",
    range: [80, 100],
  },
  functional: {
    label: "Functional",
    summary:
      "The core pieces are in place, but there are gaps costing you enquiries and rebookings every week. Closing them is straightforward work with a fast return.",
    range: [60, 79],
  },
  leaking: {
    label: "Leaking",
    summary:
      "There are significant gaps in your journey. You're winning attention and then losing people who were ready to book - which means growth is costing far more than it should.",
    range: [40, 59],
  },
  critical: {
    label: "Critical",
    summary:
      "There are major gaps across your journey. The good news is that businesses starting here usually see the fastest gains, because the fixes are foundational rather than clever.",
    range: [0, 39],
  },
};

export function bandFor(score: number): Band {
  if (score >= 80) return "optimised";
  if (score >= 60) return "functional";
  if (score >= 40) return "leaking";
  return "critical";
}

export function statusFor(score: number): Status {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

export const STATUS_LABEL: Record<Status, string> = {
  green: "Strong",
  amber: "Needs work",
  red: "Critical gap",
};

/** Is this question worth points? Free-text questions are context, not score. */
function isScored(q: Question): boolean {
  return q.weight > 0 && q.kind !== "text";
}

export function hasAnswer(q: Question, value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/** 0–1 for a single question, or null when it hasn't been answered. */
export function scoreQuestion(q: Question, value: AnswerValue | undefined): number | null {
  if (!isScored(q) || !hasAnswer(q, value)) return null;
  switch (q.kind) {
    case "choice": {
      const option = q.options.find((o) => o.value === value);
      return option ? clamp01(option.score) : null;
    }
    case "multi":
      return clamp01(q.scoreSelection(value as string[]));
    case "slider":
      if (value === UNKNOWN) return q.unknown ? clamp01(q.unknown.score) : null;
      return clamp01(q.scoreValue(value as number));
    case "scale":
      return clamp01(((value as number) - 1) / 4);
    default:
      return null;
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

/** The strength / gap / fix a single answer produces. */
function reviewQuestion(
  q: Question,
  value: AnswerValue | undefined,
): { strength?: string; gap?: string; fix?: Fix } {
  if (!hasAnswer(q, value)) return {};
  switch (q.kind) {
    case "choice": {
      const option = q.options.find((o) => o.value === value);
      if (!option) return {};
      return { strength: option.strength, gap: option.gap, fix: option.fix };
    }
    case "multi":
      return q.review?.(value as string[]) ?? {};
    case "slider":
      if (value === UNKNOWN) {
        return q.unknown ? { gap: q.unknown.gap, fix: q.unknown.fix } : {};
      }
      return q.review?.(value as number) ?? {};
    case "scale":
      return q.review?.(value as number) ?? {};
    default:
      return {};
  }
}

export function questionKey(section: Section, q: Question): string {
  return `${section.id}.${q.id}`;
}

export function scoreSection(section: Section, answers: Answers): SectionResult {
  let weighted = 0;
  let totalWeight = 0;
  let answeredCount = 0;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const fixes: Fix[] = [];

  for (const q of section.questions) {
    const value = answers[questionKey(section, q)];
    const score = scoreQuestion(q, value);
    if (score !== null) {
      weighted += score * q.weight;
      totalWeight += q.weight;
      answeredCount++;
    }
    const review = reviewQuestion(q, value);
    if (review.strength) strengths.push(review.strength);
    if (review.gap) gaps.push(review.gap);
    if (review.fix) fixes.push(review.fix);
  }

  const score = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0;
  const status = statusFor(score);
  const verdict =
    status === "green" ? section.verdict.strong : status === "amber" ? section.verdict.ok : section.verdict.weak;

  return {
    id: section.id,
    title: section.title,
    shortTitle: section.shortTitle,
    score,
    status,
    opportunity: Math.round((100 - score) * section.weight),
    strengths,
    gaps,
    fixes,
    verdict,
    tools: section.tools,
    measure: section.kpi.measure,
    answered: answeredCount > 0,
  };
}

export function scoreDiagnostic(answers: Answers): DiagnosticResult {
  const sections = SECTIONS.map((s) => scoreSection(s, answers));

  let weighted = 0;
  let totalWeight = 0;
  SECTIONS.forEach((section, i) => {
    weighted += sections[i].score * section.weight;
    totalWeight += section.weight;
  });
  const overall = totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;
  const band = bandFor(overall);

  // Priorities: where the weighted headroom is greatest - i.e. where the next
  // hour of work buys the most.
  const priorities = [...sections].sort((a, b) => b.opportunity - a.opportunity).slice(0, 3);

  // One quick win per stage, weakest stage first - three actions that pull in
  // three different directions beat three variations on the same idea.
  const byOpportunity = [...sections].sort((a, b) => b.opportunity - a.opportunity);
  const quickWins = dedupeFixes(
    byOpportunity
      .map((section) => section.fixes.find((f) => f.effort === "quick"))
      .filter((f): f is Fix => Boolean(f)),
  ).slice(0, 3);

  return {
    overall,
    band,
    bandLabel: BANDS[band].label,
    bandSummary: BANDS[band].summary,
    sections,
    priorities,
    quickWins,
    cycle: buildCycle(priorities, sections, answers, quickWins),
    clientValue: clientValueOf(answers),
    completedAt: new Date().toISOString(),
  };
}

/*
  The bands for "what is a client worth", and the midpoint each one contributes
  to the money model.

  They're pitched at where this sector actually sits: a salon client at £60
  every six weeks for a couple of years is comfortably four figures, and an
  aesthetics client on regular treatment is several. The old bands topped out at
  £1,500, which put most of the audience in one bucket and badly under-valued
  the higher-ticket clinics. Each midpoint sits slightly below the middle of its
  band, and the open top band is read conservatively rather than optimistically.
*/
const CLIENT_VALUE_BANDS: Record<string, ClientValue> = {
  "under-250": { label: "under £250", midpoint: 150 },
  "250-500": { label: "£250–£500", midpoint: 350 },
  "500-1000": { label: "£500–£1,000", midpoint: 700 },
  "1000-2500": { label: "£1,000–£2,500", midpoint: 1600 },
  "2500-5000": { label: "£2,500–£5,000", midpoint: 3500 },
  "5000-plus": { label: "over £5,000", midpoint: 7000 },
};

export function clientValueOf(answers: Answers): ClientValue | null {
  const answer = answers["retention.client-value"];
  if (typeof answer !== "string") return null;
  return CLIENT_VALUE_BANDS[answer] ?? null;
}

/** What twelve extra clients - one a month - are worth over their lifetimes. */
export function annualValueOfOneMoreClientPerMonth(value: ClientValue): string {
  const total = value.midpoint * 12;
  return `£${total.toLocaleString("en-GB")}`;
}

function dedupeFixes(fixes: Fix[]): Fix[] {
  const seen = new Set<string>();
  const out: Fix[] = [];
  for (const fix of fixes) {
    if (seen.has(fix.action)) continue;
    seen.add(fix.action);
    out.push(fix);
  }
  return out;
}

/*
  A 90-day cycle in the shape of the LEAP programme: one KPI, three or four
  priorities that all move that same KPI, then the number the next cycle takes
  on. Priorities come from the stages the KPI actually depends on - so the work
  compounds on one number instead of being spread thinly across eight.
*/
const WINDOWS = ["Weeks 1–2", "Weeks 3–6", "Weeks 7–10", "Weeks 11–13"];

function buildCycle(
  priorities: SectionResult[],
  sections: SectionResult[],
  answers: Answers,
  quickWins: Fix[],
): FocusCycle {
  const lead = priorities[0] ?? sections[0];
  const leadSection = SECTIONS.find((s) => s.id === lead.id) ?? SECTIONS[0];
  const kpi = leadSection.kpi;

  const byId = new Map(sections.map((s) => [s.id, s]));
  const scoreOf = (id: string) => byId.get(id)?.score ?? 100;

  // The stages that move this KPI, weakest first after the lead stage itself.
  const supporting = kpi.supports
    .filter((id) => id !== leadSection.id)
    .sort((a, b) => scoreOf(a) - scoreOf(b));

  // The quick wins are listed on their own as "this week", so the cycle
  // carries what comes after them rather than repeating them.
  const used = new Set<string>(quickWins.map((fix) => fix.action));
  const cyclePriorities: CyclePriority[] = [];

  for (const id of [leadSection.id, ...supporting]) {
    if (cyclePriorities.length >= WINDOWS.length) break;
    const section = SECTIONS.find((s) => s.id === id);
    const result = byId.get(id);
    if (!section || !result) continue;
    // A stage already in good shape doesn't need a priority spent on it.
    if (id !== leadSection.id && result.status === "green") continue;

    const room = id === leadSection.id ? 3 : 2;
    let steps = result.fixes.filter((fix) => !used.has(fix.action)).slice(0, room);
    // A stage whose only actions were quick wins still deserves its priority.
    if (steps.length === 0) steps = result.fixes.slice(0, 1);
    if (steps.length === 0) continue;
    steps.forEach((fix) => used.add(fix.action));

    cyclePriorities.push({
      title: section.purpose,
      stage: section.title,
      window: WINDOWS[cyclePriorities.length],
      steps: steps.map((fix) => fix.action),
    });
  }

  // The next cycle takes the strongest remaining opportunity that this one
  // didn't already cover.
  const covered = new Set(cyclePriorities.map((p) => p.stage));
  const nextSection = [...sections]
    .sort((a, b) => b.opportunity - a.opportunity)
    .map((result) => SECTIONS.find((s) => s.id === result.id))
    .find((section) => section && !covered.has(section.title) && section.id !== leadSection.id);

  const impact = estimateImpact(answers);
  const leakFor: Record<string, string> = {
    reminders: "no-shows",
    "lead-nurture": "enquiries",
    "lead-response": "enquiries",
    retention: "retention",
  };
  const worth = impact.available
    ? impact.leaks.find((leak) => leak.id === leakFor[leadSection.id])?.annual ?? null
    : null;

  return {
    stage: leadSection.title,
    kpi: kpi.name,
    metric: kpi.metric,
    why: kpi.why,
    measure: kpi.measure,
    current: kpi.current(answers),
    target: kpi.target(answers),
    worth,
    priorities: cyclePriorities,
    next: nextSection ? { stage: nextSection.title, kpi: nextSection.kpi.name } : null,
  };
}

/** How far through the assessment they are, 0–1. */
export function completionOf(answers: Answers): number {
  const required = SECTIONS.flatMap((s) =>
    s.questions.filter((q) => q.kind !== "text").map((q) => questionKey(s, q)),
  );
  const done = required.filter((key) => {
    const section = SECTIONS.find((s) => key.startsWith(`${s.id}.`));
    const q = section?.questions.find((qq) => questionKey(section, qq) === key);
    return q ? hasAnswer(q, answers[key]) : false;
  });
  return required.length === 0 ? 0 : done.length / required.length;
}

export function sectionComplete(section: Section, answers: Answers): boolean {
  return section.questions
    .filter((q) => q.kind !== "text")
    .every((q) => hasAnswer(q, answers[questionKey(section, q)]));
}
