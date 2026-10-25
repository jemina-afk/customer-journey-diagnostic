/*
  A stick figure in the brand's drawing style: one weight of line, rounded
  ends, slightly imperfect curves, no fills beyond a couple of small dots.
  Drawn on the same 64 x 64 grid as the illustrations in brand/illustrations.

  Each figure gets a seed so the crowd looks hand-drawn rather than stamped:
  the wobble is deterministic, so a recorded frame always matches the page.
*/

const WOBBLE = [
  { head: 0.0, lean: 0.0, armL: 0.0, armR: 0.0, legL: 0.0, legR: 0.0 },
  { head: -0.5, lean: 0.6, armL: 1.2, armR: -0.8, legL: 0.7, legR: -0.5 },
  { head: 0.6, lean: -0.5, armL: -1.0, armR: 1.1, legL: -0.6, legR: 0.8 },
  { head: -0.3, lean: 0.9, armL: 0.7, armR: 0.5, legL: 1.0, legR: 0.3 },
  { head: 0.4, lean: -0.8, armL: -0.6, armR: -1.2, legL: -0.9, legR: -0.4 },
  { head: -0.6, lean: 0.3, armL: 1.0, armR: 0.9, legL: 0.4, legR: -0.9 },
];

export function Figure({
  seed = 0,
  colour,
  opacity = 1,
  /** 0 = standing, 1 = gone: the figure stoops and turns away. */
  fade = 0,
}: {
  seed?: number;
  colour: string;
  opacity?: number;
  fade?: number;
}) {
  const w = WOBBLE[seed % WOBBLE.length];
  const lean = w.lean + fade * 7;
  const sink = fade * 5;
  const headY = 15 + w.head + sink;

  return (
    <svg
      /* Cropped to the figure's own width. A square box left so much air
         either side that the crowd read as small and sparse. */
      viewBox="14 2 36 60"
      width="100%"
      height="100%"
      fill="none"
      stroke={colour}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      aria-hidden
    >
      <g transform={`rotate(${lean} 32 56)`}>
        <circle cx={32 + w.head} cy={headY} r={7.2} />
        {/* The body is a bezier rather than a line, so it reads as drawn. */}
        <path
          d={`M${32 + w.head} ${headY + 7.6} C${32.6 + w.lean} ${headY + 16} ${31.6 - w.lean} ${headY + 22} ${32} ${headY + 27}`}
        />
        <path
          d={`M${22 + w.armL} ${headY + 16 + w.armL} C${27} ${headY + 12.5} ${37} ${headY + 12.5} ${42 + w.armR} ${headY + 16 + w.armR}`}
        />
        <path d={`M32 ${headY + 27} C${29 + w.legL} ${headY + 33} ${25.5 + w.legL} ${headY + 39} ${24 + w.legL} ${headY + 43}`} />
        <path d={`M32 ${headY + 27} C${35 + w.legR} ${headY + 33} ${38.5 + w.legR} ${headY + 39} ${40 + w.legR} ${headY + 43}`} />
      </g>
    </svg>
  );
}
