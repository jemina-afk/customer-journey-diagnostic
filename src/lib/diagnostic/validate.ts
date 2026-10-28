import { SECTIONS } from "./sections";
import {
  PRIORITY_CEILING,
  PRIORITY_SCORE,
  bandWithWeakestStage,
  frictionCeiling,
  levelFor,
  statusFor,
} from "./scoring";
import { estimateImpact } from "./impact";
import { DEFAULT_CURRENCY } from "./currency";
import type { Currency } from "./currency";
import type { Answers, DiagnosticResult } from "./types";

/*
  Invariants every generated report has to satisfy. These are not unit tests of
  one function; they are the things that must be true of the finished document,
  checked against the answers it came from.

  `checkReport` returns a list of failures. An empty list is a pass. The
  validation script fails loudly on anything in it, and the sample build runs
  the same function, so a change to the scoring that breaks one of these cannot
  reach a PDF unnoticed.
*/

export interface Failure {
  /** Which invariant: scores, costs, priorities, recommendations, labels,
   *  focus, nextCycle or copy. */
  area: string;
  detail: string;
}

/* The caps the estimate promises. Kept here as well as in impact.ts on
   purpose: a check that reads the value it is checking proves nothing. */
const TOTAL_CAP = 0.15;
const WORKING_WEEKS = 50;

const PLACEHOLDERS = [
  "lorem",
  "tbc",
  "todo",
  "xxx",
  "[name]",
  "[business]",
  "[location]",
  "paste the client",
];

export function checkReport(
  result: DiagnosticResult,
  answers: Answers,
  currency: Currency = DEFAULT_CURRENCY,
): Failure[] {
  const fail: Failure[] = [];
  const add = (area: string, detail: string) => fail.push({ area, detail });

  /* ------------------------------------------------------------- scores */

  result.sections.forEach((section) => {
    if (!Number.isFinite(section.score) || section.score < 0 || section.score > 100) {
      add("scores", `${section.title} scored ${section.score}, which is outside 0-100`);
    }
    if (section.score > frictionCeiling(section.gaps.length)) {
      add(
        "scores",
        `${section.title} scored ${section.score} with ${section.gaps.length} problems named, over its ceiling of ${frictionCeiling(section.gaps.length)}`,
      );
    }
    if (section.status !== statusFor(section.score)) {
      add("scores", `${section.title} is ${section.status} but ${section.score} is ${statusFor(section.score)}`);
    }
  });

  if (!Number.isFinite(result.overall) || result.overall < 0 || result.overall > 100) {
    add("scores", `overall score is ${result.overall}, which is outside 0-100`);
  }

  if (result.band !== bandWithWeakestStage(result.overall, result.sections)) {
    add("scores", `band is ${result.band}, which the weakest stage does not support`);
  }
  // A chain is not "optimised" when one of its links is broken.
  const weakest = result.sections.reduce((low, s) => Math.min(low, s.score), 100);
  if (result.band === "optimised" && weakest < 50) {
    add("scores", `the report calls the journey optimised with a stage at ${weakest}`);
  }

  // The overall score has to be the weighted mean of the stages it is made of.
  const byId = new Map(result.sections.map((s) => [s.id, s]));
  let weighted = 0;
  let totalWeight = 0;
  SECTIONS.forEach((section) => {
    const scored = byId.get(section.id);
    if (!scored) {
      add("scores", `${section.title} is missing from the result`);
      return;
    }
    weighted += scored.score * section.weight;
    totalWeight += section.weight;
  });
  const expected = totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;
  if (Math.abs(expected - result.overall) > 1) {
    add("scores", `overall is ${result.overall} but the weighted stages give ${expected}`);
  }

  /* -------------------------------------------------------------- costs */

  const impact = estimateImpact(answers, currency, result.overall, result.sections);
  if (impact.available) {
    const revenue = impact.appointmentsPerWeek * impact.averageValue * WORKING_WEEKS;
    if (Math.abs(revenue - impact.annualRevenue) > 2) {
      add("costs", `revenue is ${impact.annualRevenue} but appointments x value x 50 is ${revenue}`);
    }
    impact.leaks.forEach((leak) => {
      if (leak.annual < 0) add("costs", `${leak.label} is negative (${leak.annual})`);
      if (!Number.isFinite(leak.annual)) add("costs", `${leak.label} is not a number`);
    });

    /*
      A stage the owner can see is broken, with no figure beside it, is the
      report failing at the one job it was bought for.
    */
    result.sections
      .filter((section) => section.score < 50)
      .forEach((section) => {
        const priced = impact.leaks.find((leak) => leak.stageId === section.id);
        if (!priced || priced.annual <= 0) {
          add("costs", `${section.title} scored ${section.score} but carries no cost`);
        }
      });
    const sum = impact.leaks.reduce((total, leak) => total + leak.annual, 0);
    if (Math.abs(sum - impact.recoverable) > 1) {
      add("costs", `the total is ${impact.recoverable} but the parts add up to ${sum}`);
    }
    if (revenue > 0 && impact.recoverable > revenue * TOTAL_CAP + 1) {
      add(
        "costs",
        `the total is ${impact.recoverable}, over the ${TOTAL_CAP * 100}% cap of ${Math.round(revenue * TOTAL_CAP)}`,
      );
    }
  }

  /* --------------------------------------------------------- priorities */

  const costOf = (id: string) =>
    impact.available ? impact.leaks.find((leak) => leak.stageId === id)?.annual ?? 0 : 0;
  const ranked = [...result.sections].sort(
    (a, b) => costOf(b.id) - costOf(a.id) || b.opportunity - a.opportunity,
  );
  result.priorities.forEach((priority, i) => {
    if (ranked[i]?.id !== priority.id) {
      add(
        "priorities",
        `priority ${i + 1} is ${priority.title}, but ranking by cost then headroom gives ${ranked[i]?.title}`,
      );
    }
    if (priority.score >= PRIORITY_CEILING) {
      add("priorities", `${priority.title} scored ${priority.score} and cannot be a priority`);
    }
    if (costOf(priority.id) === 0 && priority.score >= PRIORITY_SCORE) {
      add(
        "priorities",
        `${priority.title} scored ${priority.score} with no cost against it, so it does not qualify`,
      );
    }
  });

  // Fewer than three is a legitimate answer; padding it would invent work.
  const qualifying = result.sections.filter(
    (section) =>
      section.score < PRIORITY_CEILING &&
      (costOf(section.id) > 0 || section.score < PRIORITY_SCORE),
  );
  if (result.priorities.length !== Math.min(3, qualifying.length)) {
    add(
      "priorities",
      `${result.priorities.length} priorities shown, but ${qualifying.length} stage(s) qualify`,
    );
  }
  if (qualifying.length === 0 && result.cycle.priorities[0]?.title !== "Refine and protect") {
    add("priorities", "nothing qualifies, so the plan should be Refine and protect");
  }

  // The focus cycle has to be built on the first priority, not a different one.
  if (result.priorities[0] && result.cycle.stage !== result.priorities[0].title) {
    add(
      "priorities",
      `the cycle leads on ${result.cycle.stage} but the top priority is ${result.priorities[0].title}`,
    );
  }

  /* ---------------------------------------------------- recommendations */

  const answered = new Set(
    Object.values(answers).flatMap((value) =>
      Array.isArray(value) ? value : [String(value)],
    ),
  );
  const seenActions = new Map<string, string>();
  result.sections.forEach((section) => {
    section.fixes.forEach((fix) => {
      const previous = seenActions.get(fix.action);
      if (previous && previous !== section.title) {
        add("recommendations", `"${fix.action.slice(0, 48)}..." appears in both ${previous} and ${section.title}`);
      }
      seenActions.set(fix.action, section.title);
    });

    // A stage that is not already strong must have something to do about it.
    if (section.status !== "green" && section.fixes.length === 0 && section.answered) {
      add("recommendations", `${section.title} scored ${section.score} but has no recommendation`);
    }
    // ...and a stage scoring near perfect should not be handed a pile of work.
    if (section.score >= 90 && section.fixes.length > 2) {
      add("recommendations", `${section.title} scored ${section.score} but carries ${section.fixes.length} recommendations`);
    }
  });
  void answered;

  // Nothing may appear twice across the quick wins and the cycle priorities.
  const planned = [
    ...result.quickWins.map((f) => f.action),
    ...result.cycle.priorities.flatMap((p) => p.steps),
  ];
  const duplicates = planned.filter((action, i) => planned.indexOf(action) !== i);
  duplicates.forEach((action) =>
    add("recommendations", `"${action.slice(0, 48)}..." is in the plan twice`),
  );

  /* ------------------------------------------------------------- labels */

  result.sections.forEach((section) => {
    if (section.level !== levelFor(section.score)) {
      add("labels", `${section.title} is labelled ${section.level} at ${section.score}`);
    }
    /*
      Only process language counts here. A stage can score well and still have a
      soft gap ("you don't yet know what a client is worth"), and flagging that
      as a contradiction would train everyone to ignore this check.
    */
    const gap = (section.gaps[0] ?? "").toLowerCase();
    const soundsManual =
      /\bby hand\b|\bmanual(ly)?\b|\bnothing happens\b|\bno system\b|\bnot automated\b|\bwhen you remember\b|\bif you remember\b|\bhas to be done\b|\bone at a time\b/.test(
        gap,
      );
    if (section.level === "Automated" && soundsManual) {
      add(
        "labels",
        `${section.title} is Automated but its gap reads as manual: "${(section.gaps[0] ?? "").slice(0, 60)}"`,
      );
    }
  });

  /* -------------------------------------------------------------- focus */

  const cycle = result.cycle;
  if (!cycle.kpi) add("focus", "the cycle has no KPI");
  if (!cycle.target) add("focus", "the cycle has no target");
  // A target must carry a unit of some kind, or it is just a number on a page.
  if (cycle.target && !/[%£$€]|\bminute|\bhour|\bday|\bweek|\bmonth|\breview|\bclient|\benquir|\bin \d|\d+\s*\+|out of/i.test(cycle.target)) {
    add("focus", `the target "${cycle.target}" carries no unit`);
  }
  if (cycle.current !== null && cycle.current.trim() === "") {
    add("focus", "today's number is an empty string rather than absent");
  }

  /* --------------------------------------------------------- next cycle */

  const inCycle = new Set([
    ...cycle.priorities.map((p) => p.stage),
    ...result.priorities.map((p) => p.title),
    cycle.stage,
  ]);
  if (cycle.next && inCycle.has(cycle.next.stage)) {
    add("nextCycle", `the next cycle names ${cycle.next.stage}, which is already in this one`);
  }

  const leftOver = result.sections.filter((section) => !inCycle.has(section.title));
  const everythingWorks = leftOver.every((section) => section.score >= PRIORITY_CEILING);
  if (cycle.next && everythingWorks) {
    add("nextCycle", `every remaining stage scores ${PRIORITY_CEILING}+, so no stage should be named`);
  }
  if (!cycle.next && !everythingWorks) {
    const should = [...leftOver].sort(
      (a, b) => (costOf(b.id) - costOf(a.id)) || a.score - b.score,
    )[0];
    add("nextCycle", `no stage named, but ${should?.title} is still waiting`);
  }
  if (cycle.next && !everythingWorks) {
    const should = [...leftOver].sort(
      (a, b) => (costOf(b.id) - costOf(a.id)) || a.score - b.score,
    )[0];
    if (should && should.title !== cycle.next.stage) {
      add(
        "nextCycle",
        `the next cycle names ${cycle.next.stage}, but ${should.title} costs more or scores lower`,
      );
    }
  }

  /* --------------------------------------------------------------- copy */

  const prose: string[] = [
    result.bandSummary,
    cycle.why,
    cycle.benefit,
    cycle.explainer,
    cycle.chosenBecause,
    cycle.metric,
    cycle.measure.what,
    cycle.measure.where,
    cycle.measure.cadence,
    ...result.sections.flatMap((s) => [
      s.verdict,
      s.project,
      s.nextLevel,
      ...s.strengths,
      ...s.gaps,
      ...s.fixes.flatMap((f) => [f.action, f.impact]),
      ...s.tools,
    ]),
    ...cycle.priorities.flatMap((p) => [p.title, p.window, ...p.steps]),
  ];

  prose.forEach((line) => {
    if (line === undefined || line === null) {
      add("copy", "a line of the report is undefined");
      return;
    }
    const text = String(line);
    if (text.trim() === "") add("copy", "a line of the report is empty");
    if (/undefined|NaN|\[object Object\]/.test(text)) {
      add("copy", `"${text.slice(0, 60)}" contains a rendering artefact`);
    }
    if (/[£$€]\s?0(?![.\d])/.test(text)) {
      add("copy", `"${text.slice(0, 60)}" quotes a zero money figure`);
    }
    const lower = text.toLowerCase();
    PLACEHOLDERS.forEach((p) => {
      if (lower.includes(p)) add("copy", `"${text.slice(0, 60)}" still contains placeholder text`);
    });
    // Nothing may assume they buy their enquiries.
    if (/\bcost per (lead|enquiry|click)\b|\byour ad spend\b|\bper click\b/i.test(text)) {
      add("copy", `"${text.slice(0, 60)}" assumes the business pays for enquiries`);
    }
  });

  if (result.sections.length !== SECTIONS.length) {
    add("copy", `the report has ${result.sections.length} stages, not ${SECTIONS.length}`);
  }
  if (result.cycle.priorities.length === 0) {
    add("copy", "the 90-day plan has no priorities in it");
  }

  return fail;
}
