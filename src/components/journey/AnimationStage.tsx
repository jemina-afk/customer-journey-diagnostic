"use client";

import { useEffect, useState } from "react";

import { JourneyFunnel } from "./JourneyFunnel";
import type { Variant } from "./model";

const RATIOS = {
  "9x16": { w: 1080, h: 1920, layout: "tall" as const },
  "1x1": { w: 1080, h: 1080, layout: "tall" as const },
  "16x9": { w: 1920, h: 1080, layout: "wide" as const },
};

/*
  Puts the animation on a canvas of a known size and scales it to fit the
  window, so a recording at 1080 x 1920 and a preview on a laptop show exactly
  the same composition.
*/
export function AnimationStage({
  variant,
  ratio,
  theme,
  time,
}: {
  variant: Variant;
  ratio: keyof typeof RATIOS;
  theme: "light" | "navy";
  time?: number;
}) {
  const { w, h, layout } = RATIOS[ratio] ?? RATIOS["9x16"];

  /*
    scale() takes a number, not a length, so the fit cannot be done in CSS
    alone. The recorder sets the viewport to the canvas size, where this comes
    out at exactly 1 and nothing is resampled.
  */
  /*
    The recorder steps the clock through this rather than reloading the page
    for every frame, which turns a twenty minute capture into about one.
  */
  const [recorded, setRecorded] = useState<number | undefined>(time);
  useEffect(() => setRecorded(time), [time]);
  useEffect(() => {
    if (time === undefined) return;
    const w = window as unknown as { __jfSetTime?: (t: number) => void };
    w.__jfSetTime = (t: number) => setRecorded(t);
    return () => {
      delete w.__jfSetTime;
    };
  }, [time]);

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / w, window.innerHeight / h));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [w, h]);

  return (
    <div className="stage-host">
      <div
        className="stage"
        id="stage"
        style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <JourneyFunnel variant={variant} theme={theme} layout={layout} time={recorded} loop={false} />
      </div>
      <style jsx global>{`
        html,
        body {
          margin: 0;
          background: #000;
          overflow: hidden;
        }
      `}</style>
      <style jsx>{`
        .stage-host {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        /* An overflowing grid item aligns to the start rather than centring,
           so the canvas is pinned and translated instead. */
        .stage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
