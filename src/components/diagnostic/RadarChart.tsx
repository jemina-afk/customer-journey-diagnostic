"use client";

import { motion } from "framer-motion";
import type { SectionResult } from "@/lib/diagnostic/types";

/*
  Hand-drawn SVG radar. Built rather than pulled from a chart library so the
  labels, rings and fills sit exactly on the brand — and so the same geometry
  can be redrawn as vectors inside the PDF.
*/

const SIZE = 420;
const CENTRE = SIZE / 2;
const RADIUS = 132;

export function pointOn(index: number, count: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  const r = RADIUS * value;
  return [CENTRE + Math.cos(angle) * r, CENTRE + Math.sin(angle) * r];
}

function polygon(values: number[]): string {
  return values
    .map((v, i) => {
      const [x, y] = pointOn(i, values.length, v);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

const STATUS_COLOUR: Record<string, string> = {
  green: "rgb(var(--t-green))",
  amber: "rgb(var(--t-amber))",
  red: "rgb(var(--t-red))",
};

export function RadarChart({ sections }: { sections: SectionResult[] }) {
  const values = sections.map((s) => Math.max(s.score, 4) / 100);
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`-46 -6 ${SIZE + 92} ${SIZE + 12}`}
      className="mx-auto h-auto w-full max-w-[470px]"
      role="img"
      aria-label={`Radar chart of your eight journey stages. ${sections
        .map((s) => `${s.shortTitle} ${s.score} out of 100`)
        .join(", ")}.`}
    >
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--t-clay))" stopOpacity="0.32" />
          <stop offset="100%" stopColor="rgb(var(--t-clay))" stopOpacity="0.14" />
        </radialGradient>
      </defs>

      {rings.map((r) => (
        <path
          key={r}
          d={polygon(sections.map(() => r))}
          fill="none"
          stroke="rgb(var(--t-line))"
          strokeWidth={r === 1 ? 1.2 : 0.8}
        />
      ))}

      {sections.map((section, i) => {
        const [x, y] = pointOn(i, sections.length, 1);
        return <line key={section.id} x1={CENTRE} y1={CENTRE} x2={x} y2={y} stroke="rgb(var(--t-line))" strokeWidth="0.8" />;
      })}

      <motion.path
        d={polygon(values)}
        fill="url(#radar-fill)"
        stroke="rgb(var(--t-clay))"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${CENTRE}px ${CENTRE}px` }}
      />

      {sections.map((section, i) => {
        const [x, y] = pointOn(i, sections.length, values[i]);
        return (
          <motion.circle
            key={section.id}
            cx={x}
            cy={y}
            r="4.5"
            fill={STATUS_COLOUR[section.status]}
            stroke="rgb(var(--t-card))"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.05, duration: 0.3 }}
          />
        );
      })}

      {sections.map((section, i) => {
        const [lx, ly] = pointOn(i, sections.length, 1.24);
        const anchor = lx > CENTRE + 6 ? "start" : lx < CENTRE - 6 ? "end" : "middle";
        return (
          <g key={section.id}>
            <text
              x={lx}
              y={ly - 3}
              textAnchor={anchor}
              className="fill-tulivo-ink"
              style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              {section.shortTitle}
            </text>
            <text
              x={lx}
              y={ly + 12}
              textAnchor={anchor}
              fill={STATUS_COLOUR[section.status]}
              style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {section.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ScoreDial({ score, label }: { score: number; label: string }) {
  const r = 78;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const colour =
    score >= 80 ? "rgb(var(--t-green))" : score >= 60 ? "rgb(var(--t-gold))" : score >= 40 ? "rgb(var(--t-amber))" : "rgb(var(--t-red))";

  return (
    <div className="relative inline-flex h-[196px] w-[196px] items-center justify-center">
      <svg viewBox="0 0 196 196" className="absolute inset-0 -rotate-90">
        <circle cx="98" cy="98" r={r} fill="none" stroke="rgb(var(--t-line))" strokeWidth="10" />
        <motion.circle
          cx="98"
          cy="98"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <div className="relative text-center">
        <div className="tabular text-[52px] font-semibold leading-none tracking-[-0.04em] text-tulivo-ink">
          {score}
          <span className="text-[20px] font-medium text-tulivo-faint">/100</span>
        </div>
        <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: colour }}>
          {label}
        </div>
      </div>
    </div>
  );
}
