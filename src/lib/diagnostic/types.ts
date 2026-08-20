/*
  Customer Journey Diagnostic — domain types.

  Everything here is plain data + pure functions so the same module can run in
  the browser (live scoring, PDF generation) and on the server (email
  notifications, stored submissions) without duplication.
*/

/** `"unknown"` is the sentinel a slider stores when someone doesn't track it. */
export type AnswerValue = string | string[] | number;

export const UNKNOWN = "unknown";

export type Answers = Record<string, AnswerValue>;

/** A recommendation attached to a weak answer. */
export interface Fix {
  /** What to do, in plain language. */
  action: string;
  /** What changes in the business once it's done. */
  impact: string;
  /** `quick` = doable this week with no new systems. */
  effort: "quick" | "project";
}

export interface Option {
  value: string;
  label: string;
  /** 0–1. 1 = best practice. */
  score: number;
  /** Shown in "what's working" when they pick this. */
  strength?: string;
  /** Shown in "gaps identified" when they pick this. */
  gap?: string;
  /** Recommendation generated when they pick this. */
  fix?: Fix;
}

interface BaseQuestion {
  id: string;
  prompt: string;
  hint?: string;
  /** Relative weight inside its section. */
  weight: number;
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: "choice";
  options: Option[];
}

export interface MultiQuestion extends BaseQuestion {
  kind: "multi";
  options: Option[];
  /** Shows a free-text box when a particular option is picked (e.g. "Other"). */
  specify?: { whenValue: string; prompt: string; placeholder?: string };
  /** Scores the whole selection (breadth matters more than any one option). */
  scoreSelection: (values: string[]) => number;
  /** Narrative for the selection as a whole. */
  review?: (values: string[]) => { strength?: string; gap?: string; fix?: Fix };
}

export interface SliderQuestion extends BaseQuestion {
  kind: "slider";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  /** e.g. "%" or "+ reviews" — rendered after the value. */
  unit?: string;
  /** Formats the live value, e.g. 100 -> "100+". */
  format?: (value: number) => string;
  endLabels?: [string, string];
  scoreValue: (value: number) => number;
  review?: (value: number) => { strength?: string; gap?: string; fix?: Fix };
  /** An honest way out for a number nobody tracks yet. */
  unknown?: {
    label: string;
    /** Not knowing is itself a gap, so it scores below a measured answer. */
    score: number;
    gap: string;
    fix: Fix;
  };
}

export interface ScaleQuestion extends BaseQuestion {
  kind: "scale";
  lowLabel: string;
  highLabel: string;
  review?: (value: number) => { strength?: string; gap?: string; fix?: Fix };
}

export interface TextQuestion extends BaseQuestion {
  kind: "text";
  placeholder?: string;
  optional?: true;
}

export type Question =
  | ChoiceQuestion
  | MultiQuestion
  | SliderQuestion
  | ScaleQuestion
  | TextQuestion;

/*
  The one number a 90-day cycle is judged on. Each stage owns a KPI, and each
  stage also knows which KPIs its work moves — so a focus cycle can pull three
  or four aligned priorities together instead of scattering effort.
*/
export interface Kpi {
  /** Short name, e.g. "No-show rate". */
  name: string;
  /** How it's measured, in a sentence. */
  metric: string;
  /** Why this is the number worth chasing first. */
  why: string;
  /** Stage ids whose fixes move this KPI, most important first. */
  supports: string[];
  /** Their number today, drawn from their answers where we asked for it. */
  current: (answers: Answers) => string | null;
  /** Where it should be in 90 days. */
  target: (answers: Answers) => string;
}

export interface Section {
  id: string;
  /** Full name, used in headings and the report. */
  title: string;
  /** Short name for the radar chart and journey map. */
  shortTitle: string;
  /** One line of context above the questions. */
  context: string;
  /** Why this stage matters — used in the report. */
  why: string;
  /** Weighting in the overall score. */
  weight: number;
  /** Narrative for the report, by band. */
  verdict: { strong: string; ok: string; weak: string };
  /** Tools worth considering for this stage. */
  tools: string[];
  /** What this stage contributes when it becomes a priority in a cycle. */
  purpose: string;
  /** The KPI this stage owns. */
  kpi: Kpi;
  questions: Question[];
}

export interface Profile {
  name: string;
  email: string;
  business: string;
  businessType: string;
  /** Optional — so their site can be looked at alongside their answers. */
  website?: string;
}

export type Band = "optimised" | "functional" | "leaking" | "critical";
export type Status = "green" | "amber" | "red";

export interface SectionResult {
  id: string;
  title: string;
  shortTitle: string;
  score: number;
  status: Status;
  /** Weighted headroom — how much the overall score is losing here. */
  opportunity: number;
  strengths: string[];
  gaps: string[];
  fixes: Fix[];
  verdict: string;
  tools: string[];
  answered: boolean;
}

/** Roughly what a client is worth, taken from the band they picked. */
export interface ClientValue {
  label: string;
  /** Middle of the band, used to size what a fix is worth. */
  midpoint: number;
}

export interface DiagnosticResult {
  overall: number;
  band: Band;
  bandLabel: string;
  bandSummary: string;
  sections: SectionResult[];
  priorities: SectionResult[];
  quickWins: Fix[];
  /** One KPI, three or four aligned priorities, then the next cycle. */
  cycle: FocusCycle;
  clientValue: ClientValue | null;
  completedAt: string;
}

export interface CyclePriority {
  /** What this priority is for, e.g. "Protect the diary you've already filled". */
  title: string;
  /** The stage it comes from. */
  stage: string;
  /** When in the 90 days it happens. */
  window: string;
  steps: string[];
}

export interface FocusCycle {
  /** The stage the cycle is built around. */
  stage: string;
  kpi: string;
  metric: string;
  why: string;
  /** Where they are now, when we have a number for it. */
  current: string | null;
  target: string;
  /** What moving it is worth over a year, when their numbers allow an estimate. */
  worth: number | null;
  priorities: CyclePriority[];
  /** The KPI the following cycle would take on. */
  next: { stage: string; kpi: string } | null;
}

export interface Submission {
  id: string;
  profile: Profile;
  answers: Answers;
  startedAt: string;
  completedAt?: string;
  unlocked?: boolean;
}
