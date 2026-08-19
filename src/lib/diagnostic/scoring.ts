import { SECTIONS } from "./sections";
import type {
  Answers,
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
  deterministic — the browser, the PDF and the server all call the same code.
*/

export const BANDS: Record<Band, { label: string; summary: string; range: [number, number] }> = {
  optimised: {
    label: "Optimised",
    summary:
      "Your journey is solid. The foundations are in place, so fine-tuning is what brings the next gains — not rebuilding.",
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
      "There are significant gaps in your journey. You're winning attention and then losing people who were ready to book — which means growth is costing far more than it should.",
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

  // Priorities: where the weighted headroom is greatest — i.e. where the next
  // hour of work buys the most.
  const priorities = [...sections].sort((a, b) => b.opportunity - a.opportunity).slice(0, 3);

  // One quick win per stage, weakest stage first — three actions that pull in
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
    plan: buildPlan(priorities, quickWins),
    completedAt: new Date().toISOString(),
  };
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

function buildPlan(priorities: SectionResult[], quickWins: Fix[]): DiagnosticResult["plan"] {
  const [first, second, third] = priorities;
  const plan: DiagnosticResult["plan"] = [];
  const isQuickWin = (fix: Fix) => quickWins.some((w) => w.action === fix.action);

  // The quick wins are listed on their own, so the 30-day plan carries what
  // comes after them rather than repeating them.
  const firstMonth = dedupeFixes((first?.fixes ?? []).filter((f) => !isQuickWin(f)));
  plan.push({
    horizon: "First 30 days",
    focus: first ? `Stop the biggest leak: ${first.title}` : "Lock in the quick wins",
    steps: (firstMonth.length > 0 ? firstMonth : dedupeFixes(quickWins)).slice(0, 3).map((f) => f.action),
  });

  if (second) {
    plan.push({
      horizon: "Days 31–60",
      focus: `Build the system behind ${second.title}`,
      steps: dedupeFixes(second.fixes).slice(0, 3).map((f) => f.action),
    });
  }

  if (third) {
    plan.push({
      horizon: "Days 61–90",
      focus: `Compound the gains through ${third.title}`,
      steps: dedupeFixes(third.fixes).slice(0, 3).map((f) => f.action),
    });
  }

  plan.push({
    horizon: "Ongoing",
    focus: "Measure what you've changed",
    steps: [
      "Track enquiries, bookings and no-shows weekly so improvements are visible rather than assumed.",
      "Re-run this diagnostic in 90 days to see how far your score has moved.",
    ],
  });

  return plan.filter((p) => p.steps.length > 0);
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
