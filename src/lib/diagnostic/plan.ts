import { SECTIONS } from "./sections";
import type { Fix, SectionResult } from "./types";

/*
  What the week-by-week plan needs that a recommendation does not carry on its
  own: how long a job takes, how you know it is finished, and which number it
  moves. The first two are properties of the stage rather than of each separate
  recommendation - every lead-response job is done when enquiries get a useful
  reply inside fifteen minutes, whichever of them you picked.
*/

interface StagePlan {
  /** Realistic time for a quick win and for a build, in this stage. */
  time: { quick: string; project: string };
  /** The finish line, phrased so somebody could tell you whether they hit it. */
  doneWhen: string;
}

const STAGE_PLAN: Record<string, StagePlan> = {
  "lead-sources": {
    time: { quick: "30 minutes", project: "half a day" },
    doneWhen: "every enquiry is logged with where it came from",
  },
  "lead-response": {
    time: { quick: "30 minutes", project: "half a day" },
    doneWhen: "every enquiry gets a useful first reply within 15 minutes",
  },
  "lead-nurture": {
    time: { quick: "an hour", project: "1-2 days" },
    doneWhen: "nobody who enquires goes a week without hearing from you",
  },
  booking: {
    time: { quick: "an hour", project: "half a day" },
    doneWhen: "a client can book a full appointment without messaging you",
  },
  confirmation: {
    time: { quick: "an hour", project: "half a day" },
    doneWhen: "every new client arrives knowing what is going to happen",
  },
  reminders: {
    time: { quick: "30 minutes", project: "half a day" },
    doneWhen: "every booking gets a reminder they can reply to",
  },
  reviews: {
    time: { quick: "20 minutes", project: "half a day" },
    doneWhen: "every finished appointment triggers a review request",
  },
  retention: {
    time: { quick: "30 minutes", project: "1-2 days" },
    doneWhen: "nobody leaves without being asked about their next visit",
  },
};

export interface Task {
  /** The instruction, standing on its own. */
  action: string;
  /** A short name, for referring to it without repeating the sentence. */
  short: string;
  time: string;
  doneWhen: string;
  /** The number this moves. */
  moves: string;
  stage: string;
  stageId: string;
  effort: Fix["effort"];
}

/* What each stage's work is about, so a short name never has to say "it". */
const STAGE_SUBJECT: Record<string, string> = {
  "lead-sources": "your listings",
  "lead-response": "the first reply",
  "lead-nurture": "the follow-up sequence",
  booking: "online booking",
  confirmation: "the confirmation",
  reminders: "the reminders",
  reviews: "the review request",
  retention: "the rebooking prompt",
};

/* Words a name must not end on, because they leave the reader waiting. */
const DANGLING =
  /\s+(?:and|the|a|an|to|for|with|your|our|of|in|on|at|before|after|so|that|they|it|their|this|then|from|by|is|are|was|up|out)$/i;

/*
  A short name for a task, taken from its own first clause so it reads as the
  same job rather than a summary of it. Two things make the difference between
  a name and a truncation: it stops at a clause boundary rather than a word
  count, and it never leaves a pronoun with nothing to point at, because the
  plan is read on its own page away from the sentence that explained it.
*/
export function shortName(action: string, stageId?: string): string {
  const sentence = action.split(/(?<=[.!?])\s/)[0].trim();
  const clause = sentence.split(/[,:;(]| - | so that | so | which | then /)[0].trim();

  /*
    "Finish the sequence" is thin, so it takes the rest of its sentence with it
    - but only when the whole sentence is short enough to arrive intact. Half a
    second clause is worse than none.
  */
  let name = clause;
  if (clause.split(/\s+/).length < 4 && sentence.split(/\s+/).length <= 6) {
    name = sentence;
  }
  /*
    Six words at most. A label that runs to the length of the sentence it came
    from is not a reference to the recommendation, it is the recommendation
    printed twice - which is exactly what the duplicate check exists to stop.
  */
  if (name.split(/\s+/).length > 6) {
    name = name.split(/\s+/).slice(0, 6).join(" ");
  }
  while (DANGLING.test(name)) name = name.replace(DANGLING, "");

  // "Automate it on a 10-week trigger" means nothing on its own.
  const subject = stageId ? STAGE_SUBJECT[stageId] : undefined;
  if (subject && /\bit\b/i.test(name)) {
    name = name.replace(/\bit\b/i, subject);
  }
  return name.replace(/[.,]$/, "");
}

export function taskFor(fix: Fix, section: SectionResult): Task {
  const plan = STAGE_PLAN[section.id] ?? {
    time: { quick: "an hour", project: "half a day" },
    doneWhen: "the change is live and working without you",
  };
  return {
    action: fix.action,
    short: shortName(fix.action, section.id),
    time: fix.effort === "quick" ? plan.time.quick : plan.time.project,
    doneWhen: plan.doneWhen,
    moves: SECTIONS.find((s) => s.id === section.id)?.kpi.name ?? "",
    stage: section.shortTitle,
    stageId: section.id,
    effort: fix.effort,
  };
}

/*
  Two recommendations that start the same way are the same job described twice
  - "Put a chatbot on every channel..." and "Put something on every channel
  this week..." - and a plan that lists both reads as busywork.
*/
export function mergeOverlapping(tasks: Task[]): Task[] {
  const kept: Task[] = [];
  for (const task of tasks) {
    const opening = task.action.toLowerCase().split(/\s+/).slice(0, 4).join(" ");
    const clash = kept.some(
      (other) =>
        other.stageId === task.stageId &&
        other.action.toLowerCase().split(/\s+/).slice(0, 4).join(" ") === opening,
    );
    if (!clash) kept.push(task);
  }
  return kept;
}

/** A number pulled out of "34%" or "30% repeat", for interpolating milestones. */
export function figureIn(text: string | null): number | null {
  if (!text) return null;
  const match = /(\d+(?:\.\d+)?)/.exec(text);
  return match ? Number(match[1]) : null;
}

/**
 * A milestone between today and the target. `through` is how far into the
 * quarter the phase ends, as a fraction.
 */
export function milestone(
  current: string | null,
  target: string,
  through: number,
): string | null {
  const from = figureIn(current);
  const to = figureIn(target);
  if (from === null || to === null || from === to) return null;
  const unit = /%/.test(target) ? "%" : "";
  const value = from + (to - from) * through;
  const rounded = Math.round(value);
  return `${rounded}${unit}`;
}
