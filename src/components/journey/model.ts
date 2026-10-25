/*
  The drop-off story behind the animation.

  The stages are the diagnostic's eight, but in journey order rather than the
  order the assessment asks about them. Reviews sits second here because that
  is where it actually costs you someone: they find you, look you up, and
  decide before they ever get in touch. The assessment groups it with the other
  reputation work, which is right for answering questions and wrong for telling
  the story.

  Twenty-four people, because every drop is then a whole person. The figures
  are illustrative, in the same spirit as the worked example in the guide.
*/

export interface Beat {
  /** The diagnostic stage this belongs to. */
  stage: string;
  /** What happens to the people who leave here. */
  lost: string;
  /** What the business failed to do. */
  cause: string;
  /** What it did instead, once the gap was closed. */
  fixedCause: string;
  /** How many of the 24 are still with you after this stage. */
  leaking: number;
  /** The same, once the gap is closed. */
  fixed: number;
}

export const START = 24;

export const BEATS: Beat[] = [
  {
    stage: "Discovery",
    lost: "never found you",
    cause: "One way of being found, and a half-finished profile",
    fixedCause: "A finished profile and a third way to be found",
    leaking: 20,
    fixed: 22,
  },
  {
    stage: "Reviews",
    lost: "looked you up and chose someone else",
    cause: "Too few reviews to feel like a safe choice",
    fixedCause: "Enough recent reviews to feel like a safe choice",
    leaking: 16,
    fixed: 20,
  },
  {
    stage: "Response",
    lost: "got tired of waiting for a reply",
    cause: "Enquiries answered at the end of the day",
    fixedCause: "An instant reply, with prices and a booking link",
    leaking: 12,
    fixed: 19,
  },
  {
    stage: "Follow-up",
    lost: "went quiet and never heard from you again",
    cause: "One reply, and nothing after it",
    fixedCause: "Three follow-ups over the first week",
    leaking: 10,
    fixed: 18,
  },
  {
    stage: "Booking",
    lost: "gave up trying to book",
    cause: "Booking meant messaging you and waiting",
    fixedCause: "Booking online, any hour, in two taps",
    leaking: 7,
    fixed: 17,
  },
  {
    stage: "Before the visit",
    lost: "quietly went off the idea",
    cause: "Nothing between booking and the day itself",
    fixedCause: "A confirmation, then a what-to-expect message",
    leaking: 6,
    fixed: 16,
  },
  {
    stage: "Reminders",
    lost: "forgot and didn't turn up",
    cause: "No reminder, no deposit",
    fixedCause: "Two reminders and a deposit at booking",
    leaking: 5,
    fixed: 15,
  },
  {
    stage: "Coming back",
    lost: "came once and never returned",
    cause: "Nobody asked them to book again",
    fixedCause: "The next booking asked for before they left",
    leaking: 2,
    fixed: 9,
  },
];

export type Variant = "leaking" | "fixed";

export function remainingAfter(beat: number, variant: Variant): number {
  if (beat < 0) return START;
  const b = BEATS[Math.min(beat, BEATS.length - 1)];
  return variant === "fixed" ? b.fixed : b.leaking;
}

/* ------------------------------------------------------------------ timing */

export const INTRO = 1.6;
export const BEAT = 1.7;
export const OUTRO = 3.6;
export const DURATION = INTRO + BEATS.length * BEAT + OUTRO;

export interface Frame {
  /** -1 before the first stage, BEATS.length once they are all done. */
  beat: number;
  /** 0-1 through the current beat. */
  progress: number;
  phase: "intro" | "beats" | "outro";
  /** How many are still with you, part way through the drop. */
  remaining: number;
}

/** Everything the animation needs to draw one moment, from the clock alone. */
export function frameAt(t: number, variant: Variant): Frame {
  if (t < INTRO) {
    return { beat: -1, progress: t / INTRO, phase: "intro", remaining: START };
  }
  const since = t - INTRO;
  const beat = Math.floor(since / BEAT);
  if (beat >= BEATS.length) {
    return {
      beat: BEATS.length,
      progress: Math.min((since - BEATS.length * BEAT) / OUTRO, 1),
      phase: "outro",
      remaining: remainingAfter(BEATS.length - 1, variant),
    };
  }
  const progress = (since - beat * BEAT) / BEAT;
  const before = remainingAfter(beat - 1, variant);
  const after = remainingAfter(beat, variant);
  // People leave across the first two thirds of the beat, so the number has
  // settled before the next stage arrives.
  const drop = Math.min(progress / 0.66, 1);
  const eased = drop * drop * (3 - 2 * drop);
  return {
    beat,
    progress,
    phase: "beats",
    remaining: before - (before - after) * eased,
  };
}
