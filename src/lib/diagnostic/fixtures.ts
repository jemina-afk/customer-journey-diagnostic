import { NUMBERS_KEYS, SECTIONS } from "./sections";
import { questionKey } from "./scoring";
import { UNKNOWN } from "./types";
import type { Answers, Option, Question, Section } from "./types";

/*
  Test profiles for the validation suite. They are built from the real question
  definitions rather than hand-written answer keys, so a new question cannot
  quietly leave a profile half-answered.

  `quality` picks how good an answer to give, from 0 (worst available) to 1
  (best available), and every question kind interprets it in its own terms.
*/

type Quality = number;

function pickOption(options: Option[], quality: Quality): string {
  const sorted = [...options].sort((a, b) => a.score - b.score);
  const i = Math.round(quality * (sorted.length - 1));
  return sorted[i].value;
}

/*
  A multi-select, answered by what it scores rather than by how many boxes are
  ticked. On "which routes bring you clients" more is better; on "which of
  these problems happen" more is worse, and a fixture that ticked every box to
  mean "good" gave the strong business six points of booking friction.
*/
function pickMulti(question: Extract<Question, { kind: "multi" }>, quality: Quality): string[] {
  const pool = question.options.filter((o) => !/^other$/i.test(o.value));
  const candidates: string[][] = [];

  const none = pool.find((o) => /^none/i.test(o.value));
  if (none) candidates.push([none.value]);

  const rest = pool.filter((o) => !/^none/i.test(o.value));
  for (let n = 1; n <= rest.length; n++) {
    candidates.push(rest.slice(0, n).map((o) => o.value));
  }

  let best = candidates[0] ?? [];
  let bestGap = Infinity;
  for (const pick of candidates) {
    const gap = Math.abs(question.scoreSelection(pick) - quality);
    if (gap < bestGap) {
      bestGap = gap;
      best = pick;
    }
  }
  return best;
}

/** A slider: walk the range and keep whichever value scores closest to target. */
function pickSlider(
  question: Extract<Question, { kind: "slider" }>,
  quality: Quality,
): number {
  let best = question.min;
  let bestGap = Infinity;
  for (let v = question.min; v <= question.max; v += question.step) {
    const gap = Math.abs(question.scoreValue(v) - quality);
    if (gap < bestGap) {
      bestGap = gap;
      best = v;
    }
  }
  return best;
}

function answerQuestion(
  section: Section,
  question: Question,
  quality: Quality,
  answers: Answers,
) {
  const key = questionKey(section, question);
  switch (question.kind) {
    case "choice":
      answers[key] = pickOption(question.options, quality);
      break;
    case "multi":
      answers[key] = pickMulti(question, quality);
      break;
    case "slider":
      answers[key] = pickSlider(question, quality);
      break;
    case "scale":
      answers[key] = Math.max(1, Math.min(5, Math.round(1 + quality * 4)));
      break;
    case "text":
      answers[key] = quality > 0.5 ? "Answered during testing." : "";
      break;
  }
}

export interface TestProfile {
  id: string;
  name: string;
  /** What this profile is meant to prove. */
  intent: string;
  /** Quality per stage id; `base` covers anything not named. */
  quality: { base: Quality } & Partial<Record<string, Quality>>;
  appointmentsPerWeek: number;
  valuePerClient: number;
  /** Leave the sliders and optional questions unanswered. */
  skipOptional?: boolean;
  /** The overall score this profile is expected to land in. */
  expect: { min: number; max: number };
}

export const TEST_PROFILES: TestProfile[] = [
  {
    id: "strong",
    name: "Strong business",
    intent: "Most answers good. Should score 80+ and not be told it is haemorrhaging money.",
    quality: { base: 1 },
    appointmentsPerWeek: 30,
    valuePerClient: 90,
    expect: { min: 80, max: 100 },
  },
  {
    id: "struggling",
    name: "Struggling business",
    intent: "Most answers poor. Should score under 40 and show a serious figure.",
    quality: { base: 0 },
    appointmentsPerWeek: 24,
    valuePerClient: 75,
    expect: { min: 0, max: 40 },
  },
  {
    id: "one-weak-stage",
    name: "One very weak stage",
    intent: "Strong everywhere except Lead Response. The roadmap should lead on that stage.",
    quality: { base: 1, "lead-response": 0 },
    appointmentsPerWeek: 28,
    valuePerClient: 110,
    expect: { min: 70, max: 95 },
  },
  {
    /*
      High value, low volume. Weak at the front of the journey and strong once
      a client is through the door - the shape a business has when word of
      mouth carries it and nothing else does.
    */
    id: "high-value",
    name: "High value, low volume",
    intent:
      "Few appointments at £1,200. Weak on being found and replying, strong on delivery. The cost must stay believable against revenue.",
    quality: {
      base: 0.75,
      "lead-sources": 0.15,
      "lead-response": 0.2,
      "lead-nurture": 0.25,
      reviews: 0.3,
    },
    appointmentsPerWeek: 6,
    valuePerClient: 1200,
    expect: { min: 30, max: 70 },
  },
  {
    /*
      The mirror image: good at being found and booked, and losing people at
      the back end, which is what high-volume businesses usually do.
    */
    id: "high-volume",
    name: "Low value, high volume",
    intent:
      "Sixty-five appointments a week at £40. Strong at the front, leaking at reminders and retention. Caps must hold at the other end of the range.",
    quality: {
      base: 0.7,
      reminders: 0.15,
      retention: 0.2,
      confirmation: 0.3,
      "lead-nurture": 0.35,
    },
    appointmentsPerWeek: 65,
    valuePerClient: 40,
    expect: { min: 30, max: 70 },
  },
  {
    /*
      The one most likely to walk through the door: nothing broken, nothing
      finished, and real numbers behind it.
    */
    id: "typical",
    name: "Typical business",
    intent:
      "A mid-scoring business with realistic numbers. The most likely real customer, and the one the report has to read well for.",
    quality: {
      base: 0.6,
      "lead-response": 0.4,
      retention: 0.4,
      reviews: 0.5,
    },
    appointmentsPerWeek: 22,
    valuePerClient: 85,
    expect: { min: 45, max: 78 },
  },
  {
    id: "dont-know",
    name: "Mostly 'don't know'",
    intent: "Optional questions blank and the numbers unknown. Nothing may read as undefined or £0.",
    quality: { base: 0.5 },
    appointmentsPerWeek: 0,
    valuePerClient: 0,
    skipOptional: true,
    expect: { min: 25, max: 75 },
  },
];

export function answersFor(profile: TestProfile): Answers {
  const answers: Answers = {};

  SECTIONS.forEach((section) => {
    const quality = profile.quality[section.id] ?? profile.quality.base;
    section.questions.forEach((question) => {
      if (profile.skipOptional) {
        // The honest way out, where a question offers one.
        if (question.kind === "slider" && question.unknown) {
          answers[questionKey(section, question)] = UNKNOWN;
          return;
        }
        if (question.kind === "text") return;
      }
      answerQuestion(section, question, quality, answers);
    });
  });

  if (profile.appointmentsPerWeek > 0) {
    answers[NUMBERS_KEYS.appointments] = profile.appointmentsPerWeek;
  }
  if (profile.valuePerClient > 0) {
    answers[NUMBERS_KEYS.value] = profile.valuePerClient;
  }
  return answers;
}
