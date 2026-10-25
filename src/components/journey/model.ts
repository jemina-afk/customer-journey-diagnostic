/*
  The drop-off story behind the animation.

  Copy is Jemina's own script. On screen each stage shows one short line and
  one number; the voice-over carries the rest. The stages are in journey order
  rather than the order the assessment asks about them, because reviews cost
  you someone when they look you up and decide, not after they have booked.

  Twenty-four people, because every drop is then a whole person.

  Pacing follows one rule: only one thing changes at a time. Each stage reads,
  then loses people, then shows the new count, and each part holds long enough
  to take in.
*/

export interface Beat {
  /** The stage, as the script names it. */
  stage: string;
  /** The line on screen. Short, digit-led, under eight words. */
  screen: string;
  /** The same moment once the gaps are closed. */
  fixedScreen: string;
  /** How many of the 24 are still with you after this stage. */
  leaking: number;
  /** The same, once the gap is closed. */
  fixed: number;
}

export const START = 24;

export const BEATS: Beat[] = [
  {
    stage: "Being found",
    screen: "4 never found you",
    fixedScreen: "2 still missed you",
    leaking: 20,
    fixed: 22,
  },
  {
    stage: "First impressions",
    screen: "4 checked your reviews and left",
    fixedScreen: "2 still left",
    leaking: 16,
    fixed: 20,
  },
  {
    stage: "Replying",
    screen: "4 got tired of waiting",
    fixedScreen: "1 drifted off anyway",
    leaking: 12,
    fixed: 19,
  },
  {
    stage: "Following up",
    screen: "2 went quiet",
    fixedScreen: "1 went quiet",
    leaking: 10,
    fixed: 18,
  },
  {
    stage: "Booking",
    screen: "3 gave up trying to book",
    fixedScreen: "1 gave up",
    leaking: 7,
    fixed: 17,
  },
  {
    stage: "Before the day",
    screen: "1 changed their mind",
    fixedScreen: "1 changed their mind",
    leaking: 6,
    fixed: 16,
  },
  {
    stage: "Reminders",
    screen: "1 forgot to turn up",
    fixedScreen: "1 still forgot",
    leaking: 5,
    fixed: 15,
  },
  {
    stage: "Coming back",
    screen: "3 came once and never returned",
    fixedScreen: "5 didn't return",
    leaking: 2,
    fixed: 10,
  },
];

export type Variant = "leaking" | "fixed";

export function remainingAfter(beat: number, variant: Variant): number {
  if (beat < 0) return START;
  const b = BEATS[Math.min(beat, BEATS.length - 1)];
  return variant === "fixed" ? b.fixed : b.leaking;
}

/* ------------------------------------------------------------------ timing */

/* Within one stage. Each part has one job and nothing else moves during it. */
const READ = 2.4; // the line arrives and is read
const LEAVE = 1.4; // the people who go, fade out
const SETTLE = 1.4; // the new count lands and holds

export const BEAT = READ + LEAVE + SETTLE;
/** Long enough for the hook, which carries a question as well as the setup. */
export const INTRO = 5.5;
/** The payoff line, with room for the pause before "none of them told you why". */
export const OUTRO = 6.5;
/** The call to action. */
export const CTA = 5;
export const DURATION = INTRO + BEATS.length * BEAT + OUTRO + CTA;

export type Phase = "intro" | "read" | "leave" | "settle" | "outro" | "cta";

export interface Frame {
  /** -1 before the first stage, BEATS.length once they are all done. */
  beat: number;
  phase: Phase;
  /** 0-1 through whichever part we are in. */
  progress: number;
  /** How many figures are drawn in full. Never a fraction. */
  standing: number;
  /** The one number on screen. Holds through read and leave, then lands. */
  count: number;
  /** 0-1, briefly non-zero when the count has just changed. */
  pulse: number;
  /** 0-1 fade applied to the people leaving at this stage. */
  leaving: number;
}

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

/** Everything the animation needs to draw one moment, from the clock alone. */
export function frameAt(t: number, variant: Variant): Frame {
  const last = remainingAfter(BEATS.length - 1, variant);

  if (t < INTRO) {
    return {
      beat: -1,
      phase: "intro",
      progress: t / INTRO,
      standing: START,
      count: START,
      pulse: 0,
      leaving: 0,
    };
  }

  const since = t - INTRO;
  const beat = Math.floor(since / BEAT);

  if (beat >= BEATS.length) {
    const after = since - BEATS.length * BEAT;
    if (after < OUTRO) {
      return {
        beat: BEATS.length,
        phase: "outro",
        progress: after / OUTRO,
        standing: last,
        count: last,
        pulse: 0,
        leaving: 0,
      };
    }
    return {
      beat: BEATS.length,
      phase: "cta",
      progress: Math.min((after - OUTRO) / CTA, 1),
      standing: last,
      count: last,
      pulse: 0,
      leaving: 0,
    };
  }

  const into = since - beat * BEAT;
  const before = remainingAfter(beat - 1, variant);
  const after = remainingAfter(beat, variant);

  if (into < READ) {
    // The line, alone. The crowd and the count are exactly as they were.
    return {
      beat,
      phase: "read",
      progress: into / READ,
      standing: before,
      count: before,
      pulse: 0,
      leaving: 0,
    };
  }

  if (into < READ + LEAVE) {
    // The people go. The number has not moved yet, so there is one thing to watch.
    return {
      beat,
      phase: "leave",
      progress: (into - READ) / LEAVE,
      standing: after,
      count: before,
      pulse: 0,
      leaving: smooth((into - READ) / LEAVE),
    };
  }

  // The count lands, once, and holds.
  const p = (into - READ - LEAVE) / SETTLE;
  return {
    beat,
    phase: "settle",
    progress: p,
    standing: after,
    count: after,
    pulse: Math.max(0, 1 - p / 0.3),
    leaving: 1,
  };
}

/** The on-screen line for this moment, or null outside the stages. */
export function lineFor(frame: Frame, variant: Variant): string | null {
  if (frame.beat < 0 || frame.beat >= BEATS.length) return null;
  const b = BEATS[frame.beat];
  return variant === "fixed" ? b.fixedScreen : b.screen;
}
