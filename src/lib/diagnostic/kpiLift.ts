/*
  How far a number may be asked to move in ninety days.

  A target nobody believes is worse than no target: the owner stops reading the
  rest of the page. So every KPI type has a defined maximum lift, written here
  rather than scattered through the stage definitions, and a check fails the
  build if any target exceeds it.

  Rates are in percentage points. `ratio` additionally caps the target as a
  multiple of today's figure, so a lift of eight points is not allowed to turn
  15% into something that reads like a doubling.
*/
export interface Lift {
  /** Most percentage points a quarter may add. */
  points: number;
  /** Most the target may be as a multiple of today. */
  ratio?: number;
  /** Rates that improve by going down, like no-shows. */
  direction?: "up" | "down";
}

export const KPI_LIFT: Record<string, Lift> = {
  /* Conversion is a persuasion number; it moves slowly and in small steps. */
  "Enquiry-to-client conversion": { points: 8, ratio: 1.5 },
  /* Rebooking habits move a little faster, but ten points is still a quarter
     of steady work. */
  "Repeat client rate": { points: 10, ratio: 1.6 },
  /* A no-show rate may at most be halved. */
  "No-show rate": { points: 100, ratio: 0.5, direction: "down" },
};

/** The most a target may be, given today's figure. Null where unbounded. */
export function ceilingFor(kpi: string, today: number | null): number | null {
  const lift = KPI_LIFT[kpi];
  if (!lift || today === null) return null;
  if (lift.direction === "down") {
    return today * (lift.ratio ?? 1);
  }
  const byPoints = today + lift.points;
  const byRatio = lift.ratio ? today * lift.ratio : Infinity;
  return Math.min(byPoints, byRatio);
}

/** Applies the ceiling, rounded to a whole number an owner would write down. */
export function cappedTarget(kpi: string, today: number, wanted: number): number {
  const ceiling = ceilingFor(kpi, today);
  if (ceiling === null) return Math.round(wanted);
  const lift = KPI_LIFT[kpi];
  return lift?.direction === "down"
    ? Math.ceil(Math.max(wanted, ceiling))
    : Math.floor(Math.min(wanted, ceiling));
}
