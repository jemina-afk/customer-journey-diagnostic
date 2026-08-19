/*
  Customer Journey Diagnostic — domain types.

  Everything here is plain data + pure functions so the same module can run in
  the browser (live scoring, PDF generation) and on the server (email
  notifications, stored submissions) without duplication.
*/

export type AnswerValue = string | string[] | number;

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
  questions: Question[];
}

export interface Profile {
  name: string;
  email: string;
  business: string;
  businessType: string;
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

export interface DiagnosticResult {
  overall: number;
  band: Band;
  bandLabel: string;
  bandSummary: string;
  sections: SectionResult[];
  priorities: SectionResult[];
  quickWins: Fix[];
  plan: { horizon: string; focus: string; steps: string[] }[];
  completedAt: string;
}

export interface Submission {
  id: string;
  profile: Profile;
  answers: Answers;
  startedAt: string;
  completedAt?: string;
  unlocked?: boolean;
}
