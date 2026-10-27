"use client";

import { useEffect, useRef, useState } from "react";
import { Figure } from "./Figure";
import { BEATS, DURATION, START, frameAt, lineFor, remainingAfter, type Variant } from "./model";

/*
  The drop-off animation.

  Everything is drawn from a single clock value, so the component can be played
  live on the page or stepped frame by frame by the recorder and produce
  identical pictures. No CSS transitions and no internal animation state: if it
  moves, it is because `t` moved.

  There are three things on screen and only one of them changes at a time: a
  sentence, the crowd, and a single number. The count deliberately lags the
  people, so you watch someone go and then read what it cost, rather than
  trying to do both at once.
*/

export interface JourneyFunnelProps {
  variant?: Variant;
  /** Fixed time in seconds. Leave unset to play. */
  time?: number;
  theme?: "light" | "navy";
  layout?: "auto" | "tall" | "wide";
  loop?: boolean;
  className?: string;
}

const COLOURS = {
  light: {
    bg: "rgb(var(--t-canvas))",
    figure: "rgb(var(--t-purple))",
    ink: "rgb(var(--t-ink))",
    muted: "rgb(var(--t-muted))",
    faint: "rgb(var(--t-faint))",
  },
  navy: {
    bg: "rgb(var(--t-navy))",
    figure: "rgb(var(--t-lilac))",
    ink: "rgb(var(--t-on-navy))",
    muted: "rgb(var(--t-muted-navy))",
    faint: "rgb(var(--t-muted-navy))",
  },
};

export function JourneyFunnel({
  variant = "leaking",
  time,
  theme = "light",
  layout = "auto",
  loop = true,
  className,
}: JourneyFunnelProps) {
  const [clock, setClock] = useState(0);
  const playing = time === undefined;
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - started) / 1000;
      setClock(loop ? elapsed % DURATION : Math.min(elapsed, DURATION));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [playing, loop]);

  const t = time ?? clock;
  const frame = frameAt(t, variant);
  const c = COLOURS[theme];
  const beat = frame.beat >= 0 && frame.beat < BEATS.length ? BEATS[frame.beat] : null;
  const line = lineFor(frame, variant);

  const finalLeaking = remainingAfter(BEATS.length - 1, "leaking");
  const finalFixed = remainingAfter(BEATS.length - 1, "fixed");
  const final = variant === "fixed" ? finalFixed : finalLeaking;

  // The sentence arrives on its own, and does not move once it has.
  const lineIn = frame.phase === "read" ? Math.min(frame.progress * 4, 1) : 1;
  const introIn = frame.phase === "intro" ? Math.min(frame.progress * 3, 1) : 1;
  const outroIn = frame.phase === "outro" ? Math.min(frame.progress * 2.4, 1) : 0;
  const ctaIn = frame.phase === "cta" ? Math.min(frame.progress * 3, 1) : 0;

  const isLastBeat = frame.beat === BEATS.length - 1;

  const heading =
    frame.phase === "intro"
      ? variant === "fixed"
        ? "Same 24 people. Gaps closed."
        : "24 people looked for what you do"
      : frame.phase === "outro"
        ? // The number is already below, so the hold carries the line that
          // follows it in the voice-over rather than repeating the count.
          variant === "fixed"
          ? `From the same ${START} people.`
          : "None of them told you why."
        : frame.phase === "cta"
          ? variant === "fixed"
            ? "Find your gaps."
            : "Want to know where yours are going?"
          : line;

  return (
    <div
      className={`jf ${layout === "tall" ? "jf-tall" : layout === "wide" ? "jf-wide" : ""} ${className ?? ""}`}
      style={{ background: c.bg, color: c.ink }}
    >
      <div className="jf-inner">
        <div className="jf-head">
          <p className="jf-stage" style={{ color: c.muted, opacity: beat ? 1 : 0 }}>
            {beat ? `${frame.beat + 1} of ${BEATS.length} · ${beat.stage}` : " "}
          </p>
          {/* The one sentence. Nothing else moves while it is being read. */}
          <p
            className="jf-line"
            style={{
              color: c.ink,
              opacity:
                frame.phase === "outro"
                  ? outroIn
                  : frame.phase === "cta"
                    ? ctaIn
                    : frame.phase === "intro"
                      ? introIn
                      : lineIn,
            }}
          >
            {heading}
          </p>
        </div>

        <div className="jf-crowd" style={{ opacity: introIn }}>
          {Array.from({ length: START }, (_, i) => {
            const standing = i < frame.standing;
            // Only the people leaving at this stage are mid-fade; everyone
            // already gone is simply faint, and nobody else changes.
            const goneBefore = !standing && i >= frame.standing && frame.phase === "read";
            const fading =
              !standing && frame.phase === "leave" && i < remainingAfter(frame.beat - 1, variant);
            const fade = standing ? 0 : fading ? frame.leaving : 1;
            const opacity = standing ? 1 : fading ? 1 - frame.leaving * 0.86 : goneBefore ? 0.14 : 0.14;
            return (
              <div className="jf-fig" key={i}>
                <Figure seed={i} colour={c.figure} opacity={opacity} fade={fade} />
              </div>
            );
          })}
        </div>

        {/* One number. It holds while people leave, then lands. On the last
            card it gives way to the call to action. */}
        <div className="jf-foot">
          {frame.phase === "cta" ? (
            <div className="jf-cta" style={{ opacity: ctaIn }}>
              <p className="jf-shout" style={{ color: c.ink }}>
                Comment DIAGNOSTIC
              </p>
              <p className="jf-small" style={{ color: c.muted }}>
                Illustrative figures
              </p>
            </div>
          ) : (
            <>
              <p
                className="jf-count"
                style={{
                  color: c.ink,
                  transform: `scale(${1 + frame.pulse * 0.06})`,
                }}
              >
                {frame.count}
              </p>
              <p className="jf-unit" style={{ color: c.muted }}>
                {frame.phase === "intro"
                  ? "people"
                  : frame.phase === "outro" || isLastBeat
                    ? "regulars"
                    : "still with you"}
              </p>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .jf {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          container-type: inline-size;
        }
        .jf-inner {
          width: 100%;
          height: 100%;
          max-width: 980px;
          padding: 7%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 4%;
        }
        /* A fixed height, so the crowd does not jump when a sentence runs to
           one line instead of two. */
        .jf-head {
          min-height: 20%;
        }
        .jf-stage {
          margin: 0 0 0.7em;
          font-size: clamp(11px, 2.5cqw, 18px);
          line-height: 1.3;
        }
        /* Switzer, like the rest of the page. Tightly tracked so a sentence
           lands in two rows rather than three, and its lining figures mean the
           number that opens each line reads as a number. */
        .jf-line {
          margin: 0;
          font-weight: 500;
          letter-spacing: -0.035em;
          font-size: clamp(34px, 7.2cqw, 58px);
          line-height: 1.12;
          text-wrap: balance;
        }
        .jf-crowd {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: clamp(2px, 0.8cqw, 10px);
        }
        .jf-fig {
          aspect-ratio: 36 / 60;
        }
        .jf-foot {
          display: flex;
          align-items: baseline;
          gap: clamp(10px, 2.4cqw, 26px);
          flex-wrap: wrap;
        }
        .jf-count {
          margin: 0;
          font-weight: 500;
          letter-spacing: -0.045em;
          font-size: clamp(48px, 13cqw, 110px);
          line-height: 1;
          transform-origin: left bottom;
        }
        .jf-unit {
          margin: 0;
          font-size: clamp(13px, 3cqw, 24px);
          line-height: 1.3;
        }
        .jf-cta {
          display: flex;
          flex-direction: column;
          gap: 0.5em;
        }
        .jf-shout {
          margin: 0;
          font-weight: 500;
          letter-spacing: 0.04em;
          font-size: clamp(18px, 4.4cqw, 36px);
          line-height: 1.2;
        }
        .jf-small {
          margin: 0;
          font-size: clamp(11px, 2.2cqw, 17px);
        }

        /* Tall layouts are read on a phone, so everything grows. */
        .jf-tall .jf-inner {
          max-width: none;
          padding: 9%;
        }
        .jf-tall .jf-crowd {
          grid-template-columns: repeat(6, 1fr);
          gap: clamp(4px, 1.6cqw, 14px);
        }
        .jf-tall .jf-stage {
          font-size: clamp(13px, 3.2cqw, 28px);
        }
        .jf-tall .jf-line {
          font-size: clamp(36px, 8.4cqw, 78px);
        }
        .jf-tall .jf-count {
          font-size: clamp(64px, 19cqw, 180px);
        }
        .jf-tall .jf-unit {
          font-size: clamp(15px, 3.8cqw, 34px);
        }
        .jf-tall .jf-shout {
          font-size: clamp(22px, 5.6cqw, 52px);
        }
        .jf-tall .jf-small {
          font-size: clamp(12px, 2.8cqw, 24px);
        }
      `}</style>
    </div>
  );
}
