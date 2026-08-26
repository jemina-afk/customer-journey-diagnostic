import { NUMBERS_KEYS, SECTIONS } from "./sections";
import { questionKey } from "./scoring";
import type { Answers, Profile } from "./types";

/*
  Test mode - a way to walk the whole flow, including the paid side, without
  taking a card payment or answering forty questions first.

  Where it's available:
    · local development (npm run dev) - any ?test= value switches it on
    · Vercel preview deployments - likewise, so a branch deploy is testable
    · production - only when NEXT_PUBLIC_TEST_MODE_KEY is set, and only for
      ?test=<that exact value>

  So the live diagnostic can't be unlocked by someone guessing a query string,
  but Jemina can test the real thing whenever she needs to.
*/

const KEY = process.env.NEXT_PUBLIC_TEST_MODE_KEY ?? "";
const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "";

/** True when test mode may be used at all in this deployment. */
export function testModeAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (VERCEL_ENV && VERCEL_ENV !== "production") return true;
  return KEY.length > 0;
}

/** True when this particular `?test=` value should switch test mode on. */
export function testKeyMatches(param: string | null): boolean {
  if (!param || !testModeAllowed()) return false;
  // Off the live site, any value will do - there's nothing to protect.
  if (process.env.NODE_ENV !== "production" || (VERCEL_ENV && VERCEL_ENV !== "production")) {
    return true;
  }
  return KEY.length > 0 && param === KEY;
}

export const TEST_PROFILE: Profile = {
  name: "Test Client",
  email: "test@example.com",
  business: "The Glow Room (test)",
  businessType: "Aesthetics clinic",
  website: "www.theglowroom-example.co.uk",
};

/**
 * A complete, deliberately mixed set of answers: a few strong stages, a few
 * weak ones, so the results screen and the report have something real to say.
 * `variant` shifts which option is picked, giving a different score each time.
 */
export function sampleAnswers(variant = 0): Answers {
  const answers: Answers = {};

  SECTIONS.forEach((section, sectionIndex) => {
    section.questions.forEach((question, questionIndex) => {
      const key = questionKey(section, question);
      const spread = sectionIndex + questionIndex + variant;

      switch (question.kind) {
        case "choice": {
          const options = question.options;
          answers[key] = options[spread % options.length].value;
          break;
        }
        case "multi": {
          const picks = question.options
            .filter((option, i) => i % (2 + (spread % 2)) === 0)
            .map((option) => option.value);
          answers[key] = picks.length > 0 ? picks : [question.options[0].value];
          break;
        }
        case "slider": {
          const span = question.max - question.min;
          answers[key] = Math.round(question.min + span * (0.25 + ((spread % 3) * 0.2)));
          break;
        }
        case "scale": {
          answers[key] = (spread % 5) + 1;
          break;
        }
        case "text": {
          answers[key] = "Sample answer, filled in by test mode.";
          break;
        }
      }
    });
  });

  answers[NUMBERS_KEYS.appointments] = 24 + (variant % 3) * 6;
  answers[NUMBERS_KEYS.value] = 65 + (variant % 4) * 15;

  return answers;
}
