"use client";

import { useEffect, useRef, useState } from "react";
import { Figure } from "./Figure";
import { BEATS, DURATION, START, frameAt, remainingAfter, type Variant } from "./model";

/*
  The drop-off animation.

  Everything is drawn from a single clock value, so the component can be played
  live on the page or stepped frame by frame by the recorder and produce
  identical pictures. No CSS transitions and no internal animation state: if it
  moves, it is because `t` moved.
*/

export interface JourneyFunnelProps {
  variant?: Variant;
  /** Fixed time in seconds. Leave unset to play. */
  time?: number;
  theme?: "light" | "navy";
  /** Taller layouts stack the caption under the crowd. */
  layout?: "auto" | "tall" | "wide";
  loop?: boolean;
  className?: string;
}

const COLOURS = {
  light: {
    bg: "rgb(var(--t-canvas))",
    alive: "rgb(var(--t-purple))",
    lost: "rgb(var(--t-purple))",
    ink: "rgb(var(--t-ink))",
    muted: "rgb(var(--t-muted))",
    faint: "rgb(var(--t-faint))",
    rule: "rgb(var(--t-line))",
  },
  navy: {
    bg: "rgb(var(--t-navy))",
    alive: "rgb(var(--t-lilac))",
    lost: "rgb(var(--t-lilac))",
    ink: "rgb(var(--t-on-navy))",
    muted: "rgb(var(--t-muted-navy))",
    faint: "rgb(var(--t-muted-navy))",
    rule: "rgba(255,255,255,0.14)",
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

  // Whole people are solid; the one currently leaving fades as they go.
  const whole = Math.floor(frame.remaining + 1e-6);
  const partial = frame.remaining - whole;

  // How many left at this stage, rather than how many have gone in total.
  const lostHere =
    frame.beat >= 0 && frame.beat < BEATS.length
      ? Math.max(remainingAfter(frame.beat - 1, variant) - whole, 0)
      : 0;

  const finalLeaking = remainingAfter(BEATS.length - 1, "leaking");
  const finalFixed = remainingAfter(BEATS.length - 1, "fixed");

  const introIn = Math.min(frame.phase === "intro" ? frame.progress * 2.4 : 1, 1);
  const outro = frame.phase === "outro" ? Math.min(frame.progress * 2.6, 1) : 0;

  return (
    <div
      className={`jf ${layout === "tall" ? "jf-tall" : layout === "wide" ? "jf-wide" : ""} ${className ?? ""}`}
      style={{ background: c.bg, color: c.ink }}
      data-theme={theme}
    >
      <div className="jf-inner">
        {/* Which stage we are at, and the stage track. */}
        <div className="jf-head" style={{ opacity: introIn }}>
          <p className="jf-kicker" style={{ color: c.muted }}>
            {variant === "fixed" ? "The same journey, with the gaps closed" : "Out of 24 people who wanted what you do"}
          </p>
          <p className="jf-stage" style={{ color: c.ink }}>
            {beat ? beat.stage : frame.phase === "outro" ? "After one year" : "Looking for what you do"}
          </p>
          <div className="jf-track">
            {BEATS.map((b, i) => (
              <span
                key={b.stage}
                className="jf-tick"
                style={{
                  background: c.alive,
                  opacity: frame.beat > i ? 1 : frame.beat === i ? 1 : 0.2,
                  height: frame.beat === i ? 7 : 4,
                }}
              />
            ))}
          </div>
        </div>

        {/* The crowd. Nobody moves: the survivors are simply the ones still
            drawn in full, which is what makes the loss readable at a glance. */}
        <div className="jf-crowd" style={{ opacity: introIn }}>
          {Array.from({ length: START }, (_, i) => {
            const alive = i < whole;
            const leaving = i === whole && partial > 0;
            const fade = alive ? 0 : leaving ? 1 - partial : 1;
            const opacity = alive ? 1 : leaving ? 0.14 + partial * 0.86 : 0.14;
            return (
              <div className="jf-fig" key={i}>
                <Figure seed={i} colour={alive || leaving ? c.alive : c.lost} opacity={opacity} fade={fade} />
              </div>
            );
          })}
        </div>

        {/* The count, and why the others went. */}
        <div className="jf-foot">
          {frame.phase === "outro" ? (
            <div className="jf-compare" style={{ opacity: outro }}>
              <div>
                <p className="jf-big" style={{ color: c.ink }}>
                  {variant === "fixed" ? finalFixed : finalLeaking}
                </p>
                <p className="jf-caption" style={{ color: c.muted }}>
                  {variant === "fixed"
                    ? "regulars, from the same 24 people"
                    : "regulars, from the same 24 people"}
                </p>
              </div>
              {variant === "fixed" && (
                <p className="jf-versus" style={{ color: c.muted }}>
                  Before the fixes it was {finalLeaking}.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="jf-big" style={{ color: c.ink }}>
                {whole}
                <span className="jf-of" style={{ color: c.muted }}>
                  {" "}
                  still with you
                </span>
              </p>
              <p className="jf-caption" style={{ color: c.muted, opacity: beat ? 1 : 0 }}>
                {beat ? `${lostHere === 0 ? "Nobody" : `${lostHere} of them`} ${beat.lost}` : " "}
              </p>
              <p className="jf-cause" style={{ color: c.faint, opacity: beat ? 1 : 0 }}>
                {beat ? (variant === "fixed" ? beat.fixedCause : beat.cause) : " "}
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
          padding: 6% 7%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4%;
        }
        .jf-kicker {
          margin: 0;
          font-size: clamp(11px, 2.4cqw, 17px);
          line-height: 1.3;
        }
        .jf-stage {
          margin: 0.35em 0 0;
          font-family: var(--font-italiana), Georgia, serif;
          font-size: clamp(26px, 7.2cqw, 58px);
          line-height: 1.05;
        }
        .jf-track {
          display: flex;
          gap: clamp(4px, 1cqw, 9px);
          align-items: flex-end;
          margin-top: 1em;
          height: 7px;
        }
        .jf-tick {
          flex: 1;
          border-radius: 1px;
        }
        .jf-crowd {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: clamp(2px, 0.8cqw, 10px);
        }
        .jf-fig {
          aspect-ratio: 1;
        }
        .jf-big {
          margin: 0;
          font-family: var(--font-italiana), Georgia, serif;
          font-size: clamp(40px, 11cqw, 96px);
          line-height: 1;
        }
        .jf-of {
          font-family: var(--font-inter), system-ui, sans-serif;
          font-size: clamp(12px, 2.6cqw, 20px);
        }
        .jf-caption {
          margin: 0.4em 0 0;
          font-size: clamp(13px, 2.9cqw, 22px);
          line-height: 1.35;
        }
        .jf-cause {
          margin: 0.25em 0 0;
          font-size: clamp(11px, 2.3cqw, 17px);
          line-height: 1.35;
        }
        .jf-versus {
          margin: 0.6em 0 0;
          font-size: clamp(13px, 2.9cqw, 22px);
        }
        .jf-compare {
          min-height: 1px;
        }
        /* Tall layouts have room to breathe, and need bigger type for a phone. */
        .jf-tall .jf-inner {
          max-width: none;
          padding: 8% 9%;
          gap: 5%;
        }
        .jf-tall .jf-crowd {
          grid-template-columns: repeat(6, 1fr);
          gap: clamp(4px, 1.6cqw, 14px);
        }
        .jf-tall .jf-stage {
          font-size: clamp(34px, 9.5cqw, 92px);
        }
        .jf-tall .jf-big {
          font-size: clamp(56px, 16cqw, 150px);
        }
        .jf-tall .jf-kicker {
          font-size: clamp(13px, 3.4cqw, 30px);
        }
        .jf-tall .jf-caption {
          font-size: clamp(15px, 4cqw, 36px);
        }
        .jf-tall .jf-cause,
        .jf-tall .jf-versus {
          font-size: clamp(12px, 3.2cqw, 28px);
        }
        .jf-tall .jf-of {
          font-size: clamp(14px, 3.6cqw, 32px);
        }
      `}</style>
    </div>
  );
}
