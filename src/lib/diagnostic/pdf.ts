import type { Answers, DiagnosticResult, Fix, Level, Profile, SectionResult } from "./types";
import { DIAGNOSTIC } from "./config";
import { STATUS_LABEL, annualValueOfOneMoreClientPerMonth } from "./scoring";
import { estimateImpact, formatMoney } from "./impact";
import { currencyFor } from "./currency";
import {
  AMBER,
  CREAM,
  DISPLAY,
  FAINT,
  GREEN,
  INK,
  LILAC,
  LINE,
  MUTED,
  MUTED_ON_NAVY,
  NAVY,
  OFF_WHITE,
  PURPLE,
  RED,
  SANS,
  SERIF,
  WARM_GREY,
  WHITE,
  type RGB,
} from "./brand";
import { BRAND_FONTS, GRADIENT, LOGO_RATIO, LOGO_WHITE } from "./brandAssets";
import { toolsFor } from "./tools";
import { KPI_LIFT } from "./kpiLift";
import { WHERE_TO_KEEP_IT, logFor } from "./log";
import { mergeOverlapping, milestone, taskFor, type Task } from "./plan";

/*
  The consulting deliverable. Drawn as vectors with jsPDF rather than a screen
  capture, so type stays sharp at any zoom and the file stays small enough to
  email. Loaded on demand - jsPDF never enters the initial bundle.
*/

type Doc = import("jspdf").jsPDF;

const PAGE_W = 210;
const PAGE_H = 297;
const M = 20; // page margin
const COL_W = PAGE_W - M * 2;

function statusColour(status: SectionResult["status"]): RGB {
  return status === "green" ? GREEN : status === "amber" ? AMBER : RED;
}

function bandColour(score: number): RGB {
  if (score >= 80) return GREEN;
  if (score >= 60) return PURPLE;
  if (score >= 40) return AMBER;
  return RED;
}

export async function buildReport(
  result: DiagnosticResult,
  profile: Profile,
  answers: Answers = {},
): Promise<Doc> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setLineJoin("round");
  doc.setLineCap("round");
  registerFonts(doc);

  /*
    A roadmap, not an equal write-up of eight stages. The reader has already
    paid, so the report opens on where they are and spends its pages on the two
    or three stages their own numbers say are costing the most.
  */
  const roadmap = result.priorities.filter((s) => s.status !== "green").slice(0, 3);
  const inDepth = roadmap.length > 0 ? roadmap : result.priorities.slice(0, 2);

  coverPage(doc, result, profile);
  executiveSummary(doc, result, profile, answers);
  glancePage(doc, result, profile);
  focusPage(doc, result, profile);
  inDepth.forEach((section, i) => roadmapPage(doc, section, profile, i + 1, inDepth.length));
  weekPlanPage(doc, result, profile, inDepth);
  dashboardPage(doc, result, profile, inDepth);
  nextCyclePage(doc, result, profile, inDepth);
  nextStepsPage(doc, result, profile);
  aboutPage(doc, profile);

  paginate(doc);
  return doc;
}

export async function downloadReport(
  result: DiagnosticResult,
  profile: Profile,
  answers: Answers = {},
): Promise<void> {
  const doc = await buildReport(result, profile, answers);
  doc.save(fileName(profile));
}

export async function reportDataUri(
  result: DiagnosticResult,
  profile: Profile,
  answers: Answers = {},
): Promise<string> {
  const doc = await buildReport(result, profile, answers);
  return doc.output("datauristring");
}

export function fileName(profile: Profile): string {
  const slug = profile.business
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `customer-journey-diagnostic-${slug || "report"}.pdf`;
}

/* ---------------------------------------------------------------- helpers */

/** Registers the brand fonts. Called once per document, before drawing. */
function registerFonts(doc: Doc) {
  Object.entries(BRAND_FONTS).forEach(([key, { file, data }]) => {
    doc.addFileToVFS(file, data);
    /* Switzer 500 is what headlines and card titles are set in, so it is
       registered as the family's "bold", and 600 where more weight is asked
       for. jsPDF only knows normal and bold, so Medium takes the bold slot. */
    const style = key === "switzerRegular" ? "normal" : "bold";
    doc.addFont(file, SANS, style);
  });
}

type TextOpts = { font?: string; weight?: "normal" | "bold"; charSpace?: number };

function setText(
  doc: Doc,
  size: number,
  colour: RGB,
  weight: "normal" | "bold" | TextOpts = "normal",
) {
  const opts: TextOpts = typeof weight === "string" ? { weight } : weight;
  doc.setFont(opts.font ?? SANS, opts.weight ?? "normal");
  doc.setFontSize(size);
  doc.setTextColor(colour[0], colour[1], colour[2]);
  // charSpace is stateful in jsPDF, so reset it rather than let it leak.
  doc.setCharSpace(opts.charSpace ?? 0);
}

/** The signature gradient, as a still image, for the cover. */
function gradientPage(doc: Doc) {
  doc.addImage(
    `data:image/jpeg;base64,${GRADIENT}`,
    "JPEG",
    0,
    0,
    PAGE_W,
    PAGE_H,
    "tulivo-gradient",
    "FAST",
  );
}

/** A display heading in Italiana, sentence case. */
function title(doc: Doc, lines: string[], x: number, y: number, size: number, colour: RGB, leading = size * 0.42) {
  setText(doc, size, colour, { font: DISPLAY });
  lines.forEach((line, i) => doc.text(line, x, y + i * leading));
  return y + lines.length * leading;
}

/** Draws wrapped text and returns the y position just below it. */
function paragraph(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  width: number,
  opts: {
    size?: number;
    colour?: RGB;
    weight?: "normal" | "bold";
    leading?: number;
    font?: string;
  } = {},
): number {
  const size = opts.size ?? 10;
  const leading = opts.leading ?? size * 0.52;
  setText(doc, size, opts.colour ?? MUTED, { weight: opts.weight, font: opts.font });
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line, i) => doc.text(line, x, y + i * leading));
  return y + lines.length * leading;
}

function eyebrow(doc: Doc, text: string, x: number, y: number, colour: RGB = PURPLE) {
  // A short thin rule, then a small label-grey label, as the brand asks.
  const onDark = colour === LILAC || colour === MUTED_ON_NAVY;
  const ruleColour = onDark ? LILAC : PURPLE;
  doc.setDrawColor(ruleColour[0], ruleColour[1], ruleColour[2]);
  doc.setLineWidth(0.3);
  doc.line(x, y - 1.2, x + 7, y - 1.2);
  setText(doc, 8.5, onDark ? MUTED_ON_NAVY : MUTED);
  doc.text(text, x + 10, y);
}

/** A filled circle in one call, for list markers. */
function fillCircle(doc: Doc, x: number, y: number, r: number, colour: RGB) {
  doc.setFillColor(colour[0], colour[1], colour[2]);
  doc.circle(x, y, r, "F");
}

/** A filled rectangle in one call, since jsPDF needs the colour set first. */
function fillRect(doc: Doc, x: number, y: number, w: number, h: number, colour: RGB) {
  doc.setFillColor(colour[0], colour[1], colour[2]);
  doc.rect(x, y, w, h, "F");
}

function rule(doc: Doc, y: number, x = M, w = COL_W, colour: RGB = LINE) {
  doc.setDrawColor(colour[0], colour[1], colour[2]);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y);
}

function bullet(doc: Doc, text: string, x: number, y: number, width: number, colour: RGB): number {
  doc.setFillColor(colour[0], colour[1], colour[2]);
  doc.circle(x + 1, y - 1.1, 0.85, "F");
  return paragraph(doc, text, x + 4.5, y, width - 4.5, { size: 9.5, colour: MUTED, leading: 4.4 });
}

function pageFurniture(doc: Doc, profile: Profile, label: string) {
  doc.setFillColor(OFF_WHITE[0], OFF_WHITE[1], OFF_WHITE[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  setText(doc, 7.5, FAINT, "bold");
  doc.text(label, M, 14);
  doc.text(profile.business, PAGE_W - M, 14, { align: "right" });
  rule(doc, 17.5);
}

function paginate(doc: Doc) {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    setText(doc, 7.5, FAINT, "normal");
    doc.text(`${DIAGNOSTIC.company}`, M, PAGE_H - 12);
    doc.text(`${i} / ${total}`, PAGE_W - M, PAGE_H - 12, { align: "right" });
    rule(doc, PAGE_H - 16.5);
  }
}

/** A ring gauge, drawn as short segments so it renders as clean vectors. */
function dial(
  doc: Doc,
  cx: number,
  cy: number,
  radius: number,
  score: number,
  tone: "light" | "dark" = "light",
) {
  // On navy the arc is lilac, which is the brand's highlight there. On light
  // pages it keeps the status colour, so the score still reads at a glance.
  const onDark = tone === "dark";
  const colour = onDark ? LILAC : bandColour(score);
  doc.setLineWidth(3.4);
  const track: RGB = onDark ? [58, 64, 90] : LINE;
  doc.setDrawColor(track[0], track[1], track[2]);
  doc.circle(cx, cy, radius, "S");

  const segments = Math.max(1, Math.round((score / 100) * 72));
  doc.setDrawColor(colour[0], colour[1], colour[2]);
  for (let i = 0; i < segments; i++) {
    const a0 = -Math.PI / 2 + (i / 72) * Math.PI * 2;
    const a1 = -Math.PI / 2 + ((i + 1) / 72) * Math.PI * 2;
    doc.line(
      cx + Math.cos(a0) * radius,
      cy + Math.sin(a0) * radius,
      cx + Math.cos(a1) * radius,
      cy + Math.sin(a1) * radius,
    );
  }

  const big = radius >= 18;
  setText(doc, big ? 30 : 24, onDark ? CREAM : INK, { font: DISPLAY });
  doc.text(String(score), cx, cy + (big ? 2 : 3), { align: "center" });
  if (big) {
    setText(doc, 7, onDark ? MUTED_ON_NAVY : FAINT);
    doc.text("out of 100", cx, cy + 9, { align: "center" });
  }
}

/** Radar of the eight stages, as filled vectors. */
function radar(doc: Doc, cx: number, cy: number, radius: number, sections: SectionResult[]) {
  const n = sections.length;
  const point = (i: number, v: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * radius * v, cy + Math.sin(a) * radius * v];
  };

  doc.setLineWidth(0.25);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  [0.25, 0.5, 0.75, 1].forEach((r) => {
    for (let i = 0; i < n; i++) {
      const [x1, y1] = point(i, r);
      const [x2, y2] = point((i + 1) % n, r);
      doc.line(x1, y1, x2, y2);
    }
  });
  for (let i = 0; i < n; i++) {
    const [x, y] = point(i, 1);
    doc.line(cx, cy, x, y);
  }

  const values = sections.map((s) => Math.max(s.score, 4) / 100);
  const pts = values.map((v, i) => point(i, v));
  const deltas = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]] as [number, number]);
  deltas.push([pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]]);
  doc.setFillColor(PURPLE[0], PURPLE[1], PURPLE[2]);
  doc.setDrawColor(PURPLE[0], PURPLE[1], PURPLE[2]);
  doc.setLineWidth(0.6);
  doc.setGState(doc.GState({ opacity: 0.22 }));
  doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], "F", true);
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], "S", true);

  sections.forEach((section, i) => {
    const [px, py] = point(i, values[i]);
    const colour = statusColour(section.status);
    doc.setFillColor(colour[0], colour[1], colour[2]);
    doc.circle(px, py, 1.1, "F");

    const [lx, ly] = point(i, 1.16);
    const align = lx > cx + 2 ? "left" : lx < cx - 2 ? "right" : "center";
    setText(doc, 7.5, INK, "bold");
    doc.text(section.shortTitle, lx, ly, { align: align as "left" | "right" | "center" });
    setText(doc, 7, colour, "bold");
    doc.text(String(section.score), lx, ly + 3.4, { align: align as "left" | "right" | "center" });
  });
}

function scoreBar(doc: Doc, x: number, y: number, width: number, score: number, colour: RGB) {
  doc.setFillColor(LINE[0], LINE[1], LINE[2]);
  doc.rect(x, y, width, 2.2, "F");
  doc.setFillColor(colour[0], colour[1], colour[2]);
  const w = Math.max((width * score) / 100, 2.2);
  doc.rect(x, y, w, 2.2, "F");
}

/* ------------------------------------------------------------------ pages */

function coverPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  // The signature gradient, kept still, with the white wordmark and an
  // Italiana title, as the brand book asks of document covers.
  gradientPage(doc);
  doc.addImage(LOGO_WHITE, "PNG", M, 24, 13 / LOGO_RATIO, 13, "tulivo-logo", "FAST");

  eyebrow(doc, "Customer journey diagnostic", M, 100, LILAC);
  title(doc, ["Your journey,", "stage by stage"], M, 126, 34, WHITE, 15);

  paragraph(
    doc,
    "A stage-by-stage review of how your business turns attention into booked, returning clients.",
    M,
    168,
    COL_W - 44,
    { size: 11.5, colour: CREAM, font: SERIF, leading: 6.2 },
  );

  // Score block, on the darkest part of the gradient so it reads clearly.
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(M, 186, COL_W, 46, "F");
  dial(doc, M + 30, 209, 16, result.overall, "dark");
  eyebrow(doc, "Overall score", M + 58, 201, LILAC);
  setText(doc, 18, LILAC, { font: DISPLAY });
  doc.text(result.bandLabel, M + 58, 211);
  paragraph(doc, result.bandSummary, M + 58, 217, COL_W - 68, {
    size: 8.5,
    colour: MUTED_ON_NAVY,
    leading: 4,
  });

  rule(doc, 248, M, COL_W, [70, 78, 104]);

  eyebrow(doc, "Prepared for", M, 258, LILAC);
  setText(doc, 15, CREAM, { font: SERIF });
  doc.text(profile.name, M, 266);
  setText(doc, 10, MUTED_ON_NAVY);
  doc.text(`${profile.business} \u00b7 ${profile.businessType}`, M, 272);
  if (profile.website) {
    setText(doc, 9, MUTED_ON_NAVY);
    doc.text(profile.website, M, 277.5);
  }

  eyebrow(doc, "Prepared by", PAGE_W / 2 + 10, 258, LILAC);
  setText(doc, 15, CREAM, { font: SERIF });
  doc.text(DIAGNOSTIC.consultant, PAGE_W / 2 + 10, 266);
  setText(doc, 10, MUTED_ON_NAVY);
  doc.text(DIAGNOSTIC.company, PAGE_W / 2 + 10, 272);
  setText(doc, 9, MUTED_ON_NAVY);
  doc.text(
    new Date(result.completedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    PAGE_W / 2 + 10,
    277.5,
  );
}

function executiveSummary(doc: Doc, result: DiagnosticResult, profile: Profile, answers: Answers) {
  doc.addPage();
  pageFurniture(doc, profile, "Executive summary");

  eyebrow(doc, "Executive summary", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("What your answers show", M, 40);

  dial(doc, M + 26, 70, 20, result.overall);
  setText(doc, 11, bandColour(result.overall), "bold");
  doc.text(result.bandLabel, M + 26, 98, { align: "center" });

  const textX = M + 58;
  const textW = COL_W - 58;
  let y = 56;
  y = paragraph(
    doc,
    `${profile.name}, your customer journey scores ${result.overall} out of 100. ${result.bandSummary}`,
    textX,
    y,
    textW,
    { size: 10, colour: INK, leading: 5 },
  );
  y = paragraph(
    doc,
    result.priorities[0]
      ? `Your strongest stage is ${strongest(result).title} at ${strongest(result).score}/100. The stage costing you most right now is ${result.priorities[0].title} at ${result.priorities[0].score}/100 - which is where this report starts.`
      : `Your strongest stage is ${strongest(result).title} at ${strongest(result).score}/100, and nothing scored low enough to be worth a quarter of your time. This report is about holding that and taking one stage further.`,
    textX,
    y + 5,
    textW,
    { size: 10, colour: MUTED, leading: 5 },
  );
  // With a money estimate to show, this paragraph is the one to lose - the
  // figures below make the same point harder.
  const currency = currencyFor(profile.currency);
  if (!estimateImpact(answers, currency, result.overall, result.sections).available) {
    y = paragraph(
      doc,
      "Every finding is drawn from what you told us. Nothing here is generic: the gaps are the ones your answers revealed, and the recommendations are ordered by what a fix is worth to you.",
      textX,
      y + 5,
      textW,
      { size: 10, colour: MUTED, leading: 5 },
    );
  }

  if (result.clientValue) {
    y = paragraph(
      doc,
      `At ${result.clientValue.label} per client, one extra client a month adds around ${annualValueOfOneMoreClientPerMonth(result.clientValue, currency)} in lifetime value over a year - the bar every recommendation in this report has to clear.`,
      textX,
      y + 5,
      textW,
      { size: 10, colour: INK, leading: 5 },
    );
  }

  // What it's costing, before the priorities - it's the line that makes the
  // rest of the page feel urgent rather than interesting.
  y = Math.max(y, 104) + 8;
  const impact = estimateImpact(answers, currency, result.overall, result.sections);
  if (impact.available) {
    const SHOWN = 4;
    const shown = impact.leaks.slice(0, SHOWN);
    const hidden = impact.leaks.length - shown.length;
    const boxH = 15 + shown.length * 5 + (hidden > 0 ? 5 : 0);
    doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
    doc.rect(M, y, COL_W, boxH, "F");
    setText(doc, 7.5, INK, "bold");
    doc.text("What the gaps are costing you", M + 6, y + 8);
    setText(doc, 14, INK, "bold");
    doc.text(`${formatMoney(impact.recoverable, currency)} a year`, PAGE_W - M - 6, y + 9, {
      align: "right",
    });
    let ly = y + 14.5;
    shown.forEach((leak) => {
      setText(doc, 8.5, MUTED, "normal");
      doc.text(leak.label, M + 6, ly);
      setText(doc, 8.5, INK, "bold");
      doc.text(formatMoney(leak.annual, currency), PAGE_W - M - 6, ly, { align: "right" });
      ly += 5;
    });
    if (hidden > 0) {
      const rest = impact.leaks.slice(SHOWN).reduce((sum, leak) => sum + leak.annual, 0);
      setText(doc, 8.5, FAINT, "normal");
      doc.text(`${hidden} smaller gap${hidden === 1 ? "" : "s"} across the other stages`, M + 6, ly);
      setText(doc, 8.5, FAINT, "bold");
      doc.text(formatMoney(rest, currency), PAGE_W - M - 6, ly, { align: "right" });
    }
    y += boxH + 4;

    // The cap is a share of revenue, so the revenue it is a share of is named.
    y = paragraph(
      doc,
      `Based on ${impact.appointmentsPerWeek} appointment${impact.appointmentsPerWeek === 1 ? "" : "s"} a week at ${formatMoney(impact.averageValue, currency)} over 50 working weeks, an estimated ${formatMoney(impact.annualRevenue, currency)} a year. The total above is held to 15% of that.`,
      M,
      y,
      COL_W,
      { size: 7.5, colour: FAINT, leading: 3.6 },
    );
    y += 6;
  } else {
    /* No numbers, so no figure - and the report says how to get one rather
       than leaving a hole where the money should be. */
    const boxH = 24;
    doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
    doc.rect(M, y, COL_W, boxH, "F");
    setText(doc, 7.5, INK, "bold");
    doc.text("What the gaps are costing you", M + 6, y + 8);
    setText(doc, 9.5, INK, "normal");
    doc.text(
      impact.reason === "no-leaks"
        ? "No significant leaks. Your journey is protecting your revenue."
        : "Add your appointment numbers to see what these gaps cost.",
      M + 6,
      y + 15,
    );
    setText(doc, 7.5, MUTED, "normal");
    doc.text(
      impact.reason === "no-leaks"
        ? "Nothing scored low enough to put a figure against. Keep measuring, and re-run this in ninety days."
        : "How many appointments you do in a normal week, and what one is worth on average.",
      M + 6,
      y + 20.5,
    );
    y += boxH + 8;
  }

  rule(doc, y);
  y += 10;
  eyebrow(
    doc,
    result.priorities.length === 0
      ? "Nothing here needs fixing"
      : result.priorities.length === 1
        ? "Your one priority"
        : `Your top ${result.priorities.length === 2 ? "two" : "three"} priorities`,
    M,
    y,
  );
  y += 8;

  if (result.priorities.length === 0) {
    y = paragraph(
      doc,
      `Every stage is working. There is no gap worth a quarter of your time, so the plan in this report is an upgrade rather than a repair: ${result.cycle.priorities[0]?.stage ?? "your strongest stage"}, taken a level further.`,
      M,
      y,
      COL_W,
      { size: 10, colour: INK, leading: 4.9 },
    );
  }

  /* Whatever is left of the page belongs to the priorities below, and the
     footer rule is where it stops. */
  const summaryRoom = PAGE_H - 30 - y;
  const perPriority = result.priorities.length > 0 ? summaryRoom / result.priorities.length : 0;

  result.priorities.forEach((section, i) => {
    const colour = statusColour(section.status);
    const summary = section.gaps[0] ?? section.verdict;
    setText(doc, 9, MUTED, "normal");
    const all = doc.splitTextToSize(summary, COL_W - 16) as string[];
    // However many lines the summary wants, it only gets what the page has.
    const room = Math.max(1, Math.floor((perPriority - 22) / 4.2));
    const lines = all.slice(0, room);
    const boxH = 20 + lines.length * 4.2;

    doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
    doc.rect(M, y, COL_W, boxH, "F");
    doc.setFillColor(colour[0], colour[1], colour[2]);
    doc.rect(M, y, 1.6, boxH, "F");

    setText(doc, 7.5, INK, "bold");
    doc.text(`Priority ${i + 1}`, M + 7, y + 8);
    setText(doc, 12.5, INK, "bold");
    doc.text(section.title, M + 7, y + 15);
    setText(doc, 9, colour, "bold");
    doc.text(`${section.score}/100 · ${STATUS_LABEL[section.status]}`, PAGE_W - M - 7, y + 15, { align: "right" });
    paragraph(doc, summary, M + 7, y + 21, COL_W - 16, { size: 8.5, colour: MUTED, leading: 4.2 });
    y += boxH + 5;
  });

  if (y > 248) return;
  y += 2;
  rule(doc, y);
  y += 9;
  paragraph(
    doc,
    "The next page maps all eight stages of your journey. From there the report narrows: the number to move over the next ninety days, then the two or three stages your own figures say are costing you most, written up in full.",
    M,
    y,
    COL_W,
    { size: 9.5, colour: MUTED, leading: 4.6 },
  );
}

function strongest(result: DiagnosticResult): SectionResult {
  return [...result.sections].sort((a, b) => b.score - a.score)[0];
}

/* "Every enquiry you receive..." reads wrong after a colon. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/* ------------------------------------------------- your journey at a glance */

const LEVEL_NOTE: Record<Level, string> = {
  Manual: "depends on somebody remembering",
  Systemised: "there is a process, but it still needs you",
  Automated: "happens without anyone thinking about it",
};

/** The Manual / Systemised / Automated chip, sized to its own text. */
function levelChip(doc: Doc, level: Level, x: number, y: number): number {
  setText(doc, 7, INK, "bold");
  const w = doc.getTextWidth(level.toUpperCase()) + 7;
  const colour = level === "Automated" ? GREEN : level === "Systemised" ? PURPLE : MUTED;
  doc.setDrawColor(colour[0], colour[1], colour[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y - 3.8, w, 5.6, 2.8, 2.8, "S");
  setText(doc, 6.5, colour, { weight: "bold", charSpace: 0.4 });
  doc.text(level.toUpperCase(), x + 3.5, y);
  return w;
}

function glancePage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Your journey at a glance");

  eyebrow(doc, "All eight stages", M, 30);
  setText(doc, 24, INK, { font: DISPLAY });
  doc.text("Your journey at a glance", M, 41);

  radar(doc, M + 42, 86, 28, result.sections);

  const legendX = M + 92;
  setText(doc, 8.5, INK, "bold");
  doc.text("How each stage is being run", legendX, 62);
  let ly = 69;
  (["Automated", "Systemised", "Manual"] as Level[]).forEach((level) => {
    const w = levelChip(doc, level, legendX, ly);
    setText(doc, 8, MUTED, "normal");
    const note = doc.splitTextToSize(
      LEVEL_NOTE[level],
      PAGE_W - M - (legendX + w + 4),
    ) as string[];
    doc.text(note, legendX + w + 4, ly);
    ly += 4 + note.length * 4.2;
  });
  setText(doc, 8, MUTED, "normal");
  const scale = doc.splitTextToSize(
    "Manual is under 50, Systemised is 50 to 74, Automated is 75 and over.",
    PAGE_W - M - legendX,
  ) as string[];
  doc.text(scale, legendX, ly + 2);

  let y = 124;
  rule(doc, y - 6);
  result.sections.forEach((section) => {
    const colour = statusColour(section.status);
    setText(doc, 10, INK, "bold");
    doc.text(section.title, M, y);

    const chipW = levelChip(doc, section.level, M + 72, y - 0.6);
    setText(doc, 9.5, colour, "bold");
    doc.text(`${section.score}/100`, PAGE_W - M, y, { align: "right" });

    scoreBar(doc, M + 72 + chipW + 5, y - 2.2, PAGE_W - M - (M + 72 + chipW + 5) - 16, section.score, colour);

    const gap = section.gaps[0] ?? section.verdict;
    paragraph(doc, gap, M, y + 5, COL_W - 6, { size: 8.5, colour: MUTED, leading: 4 });
    y += 19.5;
  });
}

/* ------------------------------------------------------- your 90-day focus */

function focusPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Your 90-day focus");
  const cycle = result.cycle;

  eyebrow(doc, "One number for the next three months", M, 30);
  setText(doc, 24, INK, { font: DISPLAY });
  doc.text("Your 90-day focus", M, 41);

  // The number itself, on navy, because it is the thing to remember.
  const panelH = 54;
  fillRect(doc, M, 50, COL_W, panelH, NAVY);
  setText(doc, 7.5, MUTED_ON_NAVY, { weight: "bold", charSpace: 0.6 });
  doc.text("YOUR FOCUS KPI", M + 10, 62);
  setText(doc, 19, CREAM, "bold");
  doc.text(cycle.kpi, M + 10, 74);
  setText(doc, 9, MUTED_ON_NAVY, "normal");
  doc.text(doc.splitTextToSize(cycle.metric, 96) as string[], M + 10, 82);

  const boxX = PAGE_W - M - 62;
  setText(doc, 7, MUTED_ON_NAVY, { weight: "bold", charSpace: 0.5 });
  doc.text("TODAY", boxX, 62);
  doc.text("IN 90 DAYS", boxX + 32, 62);
  setText(doc, 12, CREAM, "bold");
  doc.text(doc.splitTextToSize(cycle.current ?? "Not measured", 28) as string[], boxX, 70);
  setText(doc, 12, LILAC, "bold");
  doc.text(doc.splitTextToSize(cycle.target, 28) as string[], boxX + 32, 70);

  let y = 50 + panelH + 12;
  eyebrow(doc, "Why this number matters most for you", M, y, PURPLE);
  y = paragraph(doc, cycle.why, M, y + 8, COL_W, { size: 10.5, colour: INK, leading: 5.2 });

  y += 8;
  y = paragraph(doc, cycle.benefit, M, y, COL_W, { size: 10.5, colour: MUTED, leading: 5.2 });

  y += 12;
  rule(doc, y - 6);
  eyebrow(doc, "How this number was chosen", M, y, FAINT);
  y = paragraph(doc, cycle.chosenBecause, M, y + 8, COL_W, {
    size: 9.5,
    colour: MUTED,
    leading: 4.6,
  });

  y += 12;
  eyebrow(doc, "How to measure it", M, y, FAINT);
  paragraph(
    doc,
    "You'll track this with a simple log - page 9 shows exactly how, with a worked example.",
    M,
    y + 8,
    COL_W,
    { size: 10, colour: INK, leading: 4.9 },
  );
}

/* ---------------------------------------------------------------- roadmap */

function roadmapPage(
  doc: Doc,
  section: SectionResult,
  profile: Profile,
  index: number,
  total: number,
) {
  doc.addPage();
  pageFurniture(doc, profile, `Roadmap ${index} of ${total}`);
  const tools = toolsFor(section.id);

  eyebrow(doc, `Priority ${index}`, M, 30, PURPLE);
  setText(doc, 22, INK, { font: DISPLAY });
  doc.text(section.title, M, 41);
  const chipW = levelChip(doc, section.level, M, 48);
  setText(doc, 9, statusColour(section.status), "bold");
  doc.text(`${section.score}/100`, M + chipW + 5, 48);

  // Two columns: what is working, and what is not.
  const colW = (COL_W - 10) / 2;
  let ly = 62;
  let ry = 62;
  eyebrow(doc, "What's working", M, ly, GREEN);
  ly += 8;
  (section.strengths.length ? section.strengths : ["Nothing scored strongly here yet."])
    .slice(0, 3)
    .forEach((line) => {
      ly = bullet(doc, line, M, ly, colW, GREEN) + 1.5;
    });

  eyebrow(doc, "The gaps", M + colW + 10, ry, RED);
  ry += 8;
  (section.gaps.length ? section.gaps : ["No gaps recorded for this stage."])
    .slice(0, 3)
    .forEach((line) => {
      ry = bullet(doc, line, M + colW + 10, ry, colW, RED) + 1.5;
    });

  let y = Math.max(ly, ry) + 8;
  rule(doc, y - 6);
  eyebrow(doc, "What to do", M, y, PURPLE);
  y += 8;
  /*
    How many recommendations fit depends on how much the stage above had to
    say. Two is not a loss: the week-by-week plan carries every one of them,
    and a page that runs past its own footer costs more than a third bullet.
  */
  const fixCount = PAGE_H - 28 - y > 150 ? 3 : 2;
  section.fixes.slice(0, fixCount).forEach((fix) => {
    setText(doc, 7, fix.effort === "quick" ? GREEN : PURPLE, { weight: "bold", charSpace: 0.5 });
    doc.text(fix.effort === "quick" ? "QUICK WIN" : "PROJECT", M, y);
    y = paragraph(doc, fix.action, M + 24, y, COL_W - 24, {
      size: 9.5,
      colour: INK,
      leading: 4.5,
    });
    y = paragraph(doc, fix.impact, M + 24, y + 0.5, COL_W - 24, {
      size: 8.5,
      colour: MUTED,
      leading: 4,
    });
    y += 3.5;
  });

  // The next level, on navy, with no price attached to it.
  y += 2;
  setText(doc, 9.5, CREAM, "normal");
  const nlLines = doc.splitTextToSize(section.nextLevel, COL_W - 20) as string[];
  const nlH = 18 + nlLines.length * 4.6;
  fillRect(doc, M, y, COL_W, nlH, NAVY);
  setText(doc, 7.5, LILAC, { weight: "bold", charSpace: 0.6 });
  doc.text("THE NEXT LEVEL  ·  BUILT WITH YOU", M + 10, y + 8);
  setText(doc, 9.5, CREAM, "normal");
  doc.text(nlLines, M + 10, y + 15);
  y += nlH + 8;

  // Tools, in three tiers across the page.
  eyebrow(doc, "Tools", M, y, FAINT);
  y += 8;
  const tierW = (COL_W - 12) / 2;

  setText(doc, 8.5, INK, "bold");
  doc.text("Start here", M, y);
  let sy = y + 5.5;
  tools.startHere.forEach((line) => {
    sy = bullet(doc, line, M, sy, tierW, PURPLE) + 1;
  });

  setText(doc, 8.5, INK, "bold");
  doc.text("Tools on the market", M + tierW + 12, y);
  let my = y + 5.5;
  // Whatever room the recommendations and the next-level panel have left.
  const roomForTools = PAGE_H - 28 - y;
  tools.market.slice(0, roomForTools < 46 ? 2 : 3).forEach((tool) => {
    setText(doc, 8.5, INK, "bold");
    doc.text(tool.name, M + tierW + 12, my);
    my = paragraph(doc, tool.what, M + tierW + 12, my + 4, tierW, {
      size: 8,
      colour: MUTED,
      leading: 3.8,
    }) + 1.5;
  });

  setText(doc, 8.5, INK, "bold");
  doc.text("The joined-up version", M, sy + 4);
  // Only as many lines as the page has room for above its footer rule.
  setText(doc, 8.5, MUTED, "normal");
  const joinedLines = doc.splitTextToSize(tools.joinedUp, tierW) as string[];
  const roomForJoined = Math.max(1, Math.floor((PAGE_H - 30 - (sy + 9.5)) / 4));
  joinedLines.slice(0, roomForJoined).forEach((line, i) => {
    doc.text(line, M, sy + 9.5 + i * 4);
  });
}

/* -------------------------------------------------------- week-by-week plan */

interface Phase {
  label: string;
  window: string;
  /** How far into the quarter this phase ends, for the milestone figure. */
  through: number;
  tasks: Task[];
}

/*
  One timeline for the quarter, as a checklist rather than prose. Every
  recommendation from the roadmap is placed in a phase - quick wins from the
  stage costing most first, then the builds behind them - and overlapping jobs
  are merged, because two descriptions of the same work read as twice as much
  of it.
*/
function buildPhases(roadmap: SectionResult[]): Phase[] {
  const phases: Phase[] = [
    { label: "Phase one", window: "Weeks 1-2", through: 0.2, tasks: [] },
    { label: "Phase two", window: "Weeks 3-6", through: 0.55, tasks: [] },
    { label: "Phase three", window: "Weeks 7-12", through: 1, tasks: [] },
  ];

  const seen = new Set<string>();
  const add = (into: number, section: SectionResult, fix: Fix) => {
    if (seen.has(fix.action) || phases[into].tasks.length >= 4) return;
    seen.add(fix.action);
    phases[into].tasks.push(taskFor(fix, section));
  };

  const lead = roadmap[0];
  const rest = roadmap.slice(1);
  const quick = (s: SectionResult) => s.fixes.filter((f) => f.effort === "quick");
  const builds = (s: SectionResult) => s.fixes.filter((f) => f.effort !== "quick");

  if (lead) quick(lead).forEach((f) => add(0, lead, f));
  rest.forEach((section) => quick(section).forEach((f) => add(0, section, f)));
  if (lead) builds(lead).forEach((f) => add(1, lead, f));
  rest.forEach((section) => quick(section).forEach((f) => add(1, section, f)));
  rest.forEach((section) => builds(section).forEach((f) => add(2, section, f)));
  if (lead) builds(lead).forEach((f) => add(2, lead, f));

  phases.forEach((phase, i) => {
    if (phase.tasks.length > 0) return;
    const spare = roadmap
      .flatMap((section) => section.fixes.map((fix) => ({ section, fix })))
      .find(({ fix }) => !seen.has(fix.action));
    if (spare) add(i, spare.section, spare.fix);
  });

  phases.forEach((phase) => {
    phase.tasks = mergeOverlapping(phase.tasks);
  });
  return phases;
}

function weekPlanPage(
  doc: Doc,
  result: DiagnosticResult,
  profile: Profile,
  roadmap: SectionResult[],
) {
  doc.addPage();
  pageFurniture(doc, profile, "Your 90 days");
  const phases = buildPhases(roadmap);
  const cycle = result.cycle;

  eyebrow(doc, "The plan", M, 30, PURPLE);
  setText(doc, 24, INK, { font: DISPLAY });
  doc.text("Week by week", M, 41);

  /*
    Only claim everything moves one number when everything does. A plan that
    includes retention work while the focus is response time is doing two
    jobs, and saying so is more useful than a tidy sentence.
  */
  const all = phases.flatMap((phase) => phase.tasks);
  const offFocus = all.filter((task) => task.moves !== cycle.kpi);
  const intro =
    offFocus.length === 0
      ? `All of it moves ${cycle.kpi}.`
      : `Most of this moves ${cycle.kpi}; the ${[...new Set(offFocus.map((t) => t.stage.toLowerCase()))].join(" and ")} tasks protect the clients you win.`;
  let y = paragraph(doc, `Everything from the roadmap, in the order to do it. ${intro}`, M, 51, COL_W, {
    size: 10,
    colour: MUTED,
    leading: 5,
  });

  /* Four columns, sized so the instruction gets the room and the rest stay
     scannable down the page. */
  const COLS = [COL_W * 0.44, COL_W * 0.13, COL_W * 0.27, COL_W * 0.16];
  const X: number[] = [];
  COLS.reduce((left, width, i) => {
    X[i] = left;
    return left + width;
  }, M);

  y += 6;

  /*
    Measure first, draw second. Every row's height depends on how its own text
    wraps, so the only honest way to know whether the table fits is to add it
    up - then trim the longest phase until it does, and share whatever room is
    left between the rows rather than leaving it at the foot.
  */
  const rowHeight = (task: Task) => {
    setText(doc, 8.5, INK, "normal");
    const a = (doc.splitTextToSize(task.short, COLS[0] - 4) as string[]).length;
    setText(doc, 7.5, MUTED, "normal");
    const d = (doc.splitTextToSize(task.doneWhen, COLS[2] - 4) as string[]).length;
    const m = (doc.splitTextToSize(task.moves, COLS[3] - 4) as string[]).length;
    return Math.max(a * 4.2, d * 3.9, m * 3.9) + 4.5;
  };

  const tableHeight = (perPhase: number, pad: number) =>
    phases.reduce(
      (total, phase) =>
        total +
        22 +
        phase.tasks
          .slice(0, perPhase)
          .reduce((sum, task) => sum + rowHeight(task) + pad, 0),
      0,
    );

  const room = PAGE_H - 30 - y;
  let perPhase = 4;
  while (perPhase > 1 && tableHeight(perPhase, 0) > room) perPhase -= 1;
  phases.forEach((phase) => {
    phase.tasks = phase.tasks.slice(0, perPhase);
  });
  const shown = phases.reduce((n, phase) => n + phase.tasks.length, 0);
  const pad = Math.max(0, Math.min(5, (room - tableHeight(perPhase, 0)) / Math.max(shown, 1)));

  let started = 0;
  phases.forEach((phase, i) => {
    setText(doc, 11.5, INK, "bold");
    doc.text(`${phase.label}`, M, y);
    setText(doc, 9, PURPLE, "bold");
    doc.text(phase.window, PAGE_W - M, y, { align: "right" });
    y += 6;

    fillRect(doc, M, y - 4, COL_W, 6.5, WARM_GREY);
    setText(doc, 6.5, INK, { weight: "bold", charSpace: 0.4 });
    ["TASK", "TIME", "DONE WHEN", "MOVES"].forEach((head, c) => doc.text(head, X[c] + 2, y));
    y += 6;

    phase.tasks.forEach((task) => {
      setText(doc, 8.5, INK, "normal");
      const actionLines = doc.splitTextToSize(task.short, COLS[0] - 4) as string[];
      setText(doc, 7.5, MUTED, "normal");
      const doneLines = doc.splitTextToSize(task.doneWhen, COLS[2] - 4) as string[];
      const movesLines = doc.splitTextToSize(task.moves, COLS[3] - 4) as string[];
      const rowH = rowHeight(task) + pad;

      // The first jobs of the quarter are marked where they sit, so the page
      // needs no second list telling the reader where to start.
      const startLabel = i === 0 && started < 3;
      if (startLabel) started += 1;

      setText(doc, 8.5, INK, "normal");
      doc.text(actionLines, X[0] + 2, y);
      if (startLabel) {
        setText(doc, 6, PURPLE, { weight: "bold", charSpace: 0.4 });
        doc.text("START THIS WEEK", X[0] + 2, y + actionLines.length * 4.2 + 1.5);
      }
      setText(doc, 8, INK, "bold");
      doc.text(task.time, X[1] + 2, y);
      setText(doc, 7.5, MUTED, "normal");
      doc.text(doneLines, X[2] + 2, y);
      doc.text(movesLines, X[3] + 2, y);

      y += rowH + (startLabel ? 4 : 0);
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.setLineWidth(0.2);
      doc.line(M, y - 2.5, PAGE_W - M, y - 2.5);
    });

    const figure = milestone(cycle.current, cycle.target, phase.through);
    const week = phase.window.split("-")[1] ?? phase.window;
    setText(doc, 8, PURPLE, "normal");
    doc.text(
      figure
        ? `By the end of week ${week}, your ${cycle.kpi.toLowerCase()} should be around ${figure}.`
        : `By the end of week ${week}, ${phase.tasks[0]?.doneWhen ?? "this phase should be running without you"}.`,
      M,
      y + 2,
    );
    y += 10;
  });
}

/* ------------------------------------------------- your tracking dashboard */

/*
  The tracking page answers three questions in order: what do I write down,
  how do I turn that into the number, and when do I do it. The example
  dashboard at the top stays; everything under it is the practical half.
*/
function dashboardPage(
  doc: Doc,
  result: DiagnosticResult,
  profile: Profile,
  roadmap: SectionResult[],
) {
  doc.addPage();
  pageFurniture(doc, profile, "Your tracking dashboard");
  const cycle = result.cycle;

  eyebrow(doc, "One screen, once a month", M, 30, PURPLE);
  setText(doc, 24, INK, { font: DISPLAY });
  doc.text("Your tracking dashboard", M, 41);
  paragraph(
    doc,
    "This is what to build, not what you have. The figures below are an example of the shape; yours go in once you start recording.",
    M,
    51,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  let y = 64;
  fillRect(doc, M, y, COL_W, 40, NAVY);
  setText(doc, 7, MUTED_ON_NAVY, { weight: "bold", charSpace: 0.6 });
  doc.text("YOUR FOCUS KPI", M + 10, y + 10);
  setText(doc, 11, CREAM, "bold");
  doc.text(cycle.kpi, M + 10, y + 19);
  setText(doc, 8, MUTED_ON_NAVY, "normal");
  doc.text("This month against last month", M + 10, y + 27);
  setText(doc, 7, FAINT, { weight: "bold", charSpace: 0.5 });
  doc.text("EXAMPLE FIGURES", M + 10, y + 34);

  const example = exampleFigures(cycle);
  setText(doc, 26, CREAM, "bold");
  doc.text(example.now, M + 86, y + 24);
  setText(doc, 7.5, MUTED_ON_NAVY, "normal");
  doc.text("this month", M + 86, y + 30);
  setText(doc, 14, MUTED_ON_NAVY, "bold");
  doc.text(example.before, M + 110, y + 24);
  setText(doc, 7.5, MUTED_ON_NAVY, "normal");
  doc.text("last month", M + 110, y + 30);
  sparkline(doc, PAGE_W - M - 36, y + 11, 30, 16, example.improving);
  setText(doc, 7, MUTED_ON_NAVY, "normal");
  doc.text("last 12 weeks", PAGE_W - M - 36, y + 33);
  y += 48;

  const supporting = roadmap
    .filter((section) => section.kpiName !== cycle.kpi)
    .map((section) => ({
      name: section.kpiName,
      stage: section.shortTitle,
      figure: TILE_EXAMPLE[section.kpiName] ?? "- ",
    }));
  const extra = [
    { name: "Enquiries received", stage: "Lead Sources", figure: "41 this month" },
    { name: "Appointments booked", stage: "Booking", figure: "96 this month" },
    { name: "Clients who came back", stage: "Retention", figure: "38 this month" },
  ].filter((tile) => tile.name !== cycle.kpi);
  const tiles = [...supporting, ...extra].slice(0, 3);

  const tw = (COL_W - 8) / 3;
  tiles.forEach((tile, i) => {
    const tx = M + i * (tw + 4);
    fillRect(doc, tx, y, tw, 20, WARM_GREY);
    setText(doc, 6.5, FAINT, { weight: "bold", charSpace: 0.4 });
    doc.text(tile.stage.toUpperCase(), tx + 4, y + 6);
    setText(doc, 8, INK, "normal");
    doc.text(doc.splitTextToSize(tile.name, tw - 8).slice(0, 1) as string[], tx + 4, y + 11);
    setText(doc, 10, INK, "bold");
    doc.text(tile.figure, tx + 4, y + 17);
  });
  y += 28;

  /* ------------------------------------------------------------ your log */

  const log = logFor(cycle.kpi);
  rule(doc, y - 2);
  y += 6;
  eyebrow(doc, "Your log", M, y, PURPLE);
  y += 8;
  y = paragraph(doc, WHERE_TO_KEEP_IT, M, y, COL_W, { size: 9, colour: MUTED, leading: 4.3 });
  y += 4;

  const cw = COL_W / log.columns.length;
  fillRect(doc, M, y - 4, COL_W, 6.5, WARM_GREY);
  setText(doc, 6, INK, { weight: "bold", charSpace: 0.3 });
  log.columns.forEach((head, i) => {
    doc.text(doc.splitTextToSize(head.toUpperCase(), cw - 3).slice(0, 1) as string[], M + 2 + i * cw, y);
  });
  y += 6;
  log.rows.forEach((row) => {
    setText(doc, 7.5, INK, "normal");
    row.forEach((cell, i) => {
      doc.text(doc.splitTextToSize(cell, cw - 3).slice(0, 1) as string[], M + 2 + i * cw, y);
    });
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(M, y + 2, PAGE_W - M, y + 2);
    y += 6.5;
  });
  y += 4;

  /* -------------------------------------------- working out your number */

  eyebrow(doc, "Working out your number", M, y, FAINT);
  y += 8;
  fillRect(doc, M, y - 5, COL_W, 13, WARM_GREY);
  fillRect(doc, M, y - 5, 1.6, 13, PURPLE);
  setText(doc, 10, INK, "bold");
  doc.text(log.worked, M + 7, y + 2.5);
  y += 13;
  y = paragraph(doc, log.whichMonth, M, y, COL_W, { size: 9, colour: MUTED, leading: 4.3 });
  y += 6;

  /* ------------------------------------------------ your 10-minute Monday */

  eyebrow(doc, "Your 10-minute Monday", M, y, PURPLE);
  y += 8;
  log.monday.forEach((step, i) => {
    fillCircle(doc, M + 2.6, y - 1.2, 2.6, PURPLE);
    setText(doc, 6.5, WHITE, "bold");
    doc.text(String(i + 1), M + 2.6, y + 0.4, { align: "center" });
    setText(doc, 9, INK, "normal");
    y = paragraph(doc, step, M + 8, y, COL_W - 8, { size: 9, colour: INK, leading: 4.3 }) + 2.5;
  });
  y += 4;

  // The scoreboard, with the milestones from the plan already in it.
  const targets = [0.2, 0.55, 1].map((through) => milestone(cycle.current, cycle.target, through));
  const cols = ["Month", "Your number", "Target", "What you changed"];
  const sw = COL_W / cols.length;
  fillRect(doc, M, y - 4, COL_W, 6.5, WARM_GREY);
  setText(doc, 6.5, INK, { weight: "bold", charSpace: 0.3 });
  cols.forEach((col, i) => doc.text(col.toUpperCase(), M + 2 + i * sw, y));
  y += 6.5;
  ["Month 1", "Month 2", "Month 3"].forEach((month, i) => {
    setText(doc, 8, MUTED, "normal");
    doc.text(month, M + 2, y);
    setText(doc, 8, PURPLE, "bold");
    doc.text(targets[i] ?? cycle.target, M + 2 + 2 * sw, y);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(M, y + 2.5, PAGE_W - M, y + 2.5);
    y += 6.2;
  });
}

/*
  Example figures for the dashboard, in the focus KPI's own unit. "This month"
  is today's number moved one step; a rate that improves by going down, like a
  no-show rate, moves down.
*/
function exampleFigures(cycle: DiagnosticResult["cycle"]) {
  const today = cycle.current ?? "";
  const number = /(\d+(?:\.\d+)?)/.exec(today);
  const lift = KPI_LIFT[cycle.kpi];
  const down = lift?.direction === "down";

  if (!number) return { now: "- ", before: "- ", improving: true };

  const value = Number(number[1]);
  const step = Math.max(1, Math.round(value * 0.08));
  const now = down ? Math.max(0, value - step) : value + step;
  const unit = /%/.test(today) ? "%" : "";
  return { now: `${now}${unit}`, before: `${value}${unit}`, improving: !down };
}

/** Example figures for the supporting tiles, in each number's own unit. */
const TILE_EXAMPLE: Record<string, string> = {
  "New enquiries a month": "41 this month",
  "Enquiry response time": "22 minutes",
  "Enquiry-to-client conversion": "34%",
  "Bookings taken without you": "61% online",
  "First-appointment attendance": "88%",
  "No-show rate": "9%",
  "Google reviews": "64 total, 7 new",
  "Repeat client rate": "38%",
};

/** A twelve-week trend line, drawn from an example shape rather than data. */
function sparkline(doc: Doc, x: number, y: number, w: number, h: number, improving = true) {
  const rising = [0.22, 0.3, 0.26, 0.38, 0.44, 0.4, 0.52, 0.6, 0.58, 0.7, 0.78, 0.86];
  const points = improving ? rising : [...rising].reverse();
  doc.setDrawColor(LILAC[0], LILAC[1], LILAC[2]);
  doc.setLineWidth(0.6);
  points.forEach((p, i) => {
    if (i === 0) return;
    const x1 = x + ((i - 1) / (points.length - 1)) * w;
    const x2 = x + (i / (points.length - 1)) * w;
    doc.line(x1, y + h - points[i - 1] * h, x2, y + h - p * h);
  });
  fillCircle(doc, x + w, y + h - points[points.length - 1] * h, 1.1, LILAC);
}

/* -------------------------------------------------------- your next cycle */

function nextCyclePage(doc: Doc, result: DiagnosticResult, profile: Profile, roadmap: SectionResult[]) {
  doc.addPage();
  pageFurniture(doc, profile, "Your next cycle");

  const inRoadmap = new Set(roadmap.map((s) => s.id));
  const rest = result.sections.filter((s) => !inRoadmap.has(s.id));

  eyebrow(doc, "After this quarter", M, 30, FAINT);
  setText(doc, 24, INK, { font: DISPLAY });
  doc.text("Your next cycle", M, 41);
  let y = paragraph(
    doc,
    "These stages are not in the plan on purpose. A quarter spent on everything is a quarter spent on nothing. They are here so you know what is waiting, not so you start on them now.",
    M,
    51,
    COL_W,
    { size: 10.5, colour: MUTED, leading: 5.2 },
  );

  y += 10;
  rest.forEach((section) => {
    const colour = statusColour(section.status);
    setText(doc, 11, INK, "bold");
    doc.text(section.title, M, y);
    const chipW = levelChip(doc, section.level, M + 72, y - 0.6);
    setText(doc, 10, colour, "bold");
    doc.text(`${section.score}/100`, PAGE_W - M, y, { align: "right" });
    void chipW;
    y = paragraph(doc, section.gaps[0] ?? section.verdict, M, y + 6, COL_W - 6, {
      size: 9.5,
      colour: MUTED,
      leading: 4.6,
    });
    y += 7;
  });

  const foot = Math.max(y + 6, PAGE_H - 70);
  fillRect(doc, M, foot, COL_W, 34, NAVY);
  setText(doc, 7.5, LILAC, { weight: "bold", charSpace: 0.6 });
  doc.text("WHEN TO COME BACK", M + 10, foot + 11);
  setText(doc, 10.5, CREAM, "normal");
  const next = result.cycle.next?.stage ?? rest[0]?.title ?? "the next weakest stage";
  doc.text(
    doc.splitTextToSize(
      `Re-run the diagnostic in 90 days. When your focus number has moved and held, your next cycle starts with ${next}.`,
      COL_W - 20,
    ) as string[],
    M + 10,
    foot + 20,
  );
}

function nextStepsPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Next steps");

  eyebrow(doc, "Next steps", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("Three ways to close these gaps", M, 40);
  paragraph(
    doc,
    `Everything in this report is one 90-day cycle: ${result.cycle.kpi} as the focus, with the priorities that move it. That is exactly how the LEAP sprint runs. You can run it yourself - the real question is how much of it you want to carry alone.`,
    M,
    50,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  let y = 70;
  DIAGNOSTIC.offers.forEach((offer, i) => {
    const lines = doc.splitTextToSize(offer.description, COL_W - 14) as string[];
    const boxH = 20 + lines.length * 4.4;
    const tint: RGB = offer.emphasis ? WARM_GREY : OFF_WHITE;
    doc.setFillColor(tint[0], tint[1], tint[2]);
    doc.rect(M, y, COL_W, boxH, "F");
    setText(doc, 8, INK, "bold");
    doc.text(`Option ${i + 1}`, M + 6, y + 8);
    setText(doc, 13, INK, "bold");
    doc.text(offer.name, M + 6, y + 15);
    setText(doc, 11, INK, "bold");
    doc.text(offer.price, PAGE_W - M - 6, y + 15, { align: "right" });
    paragraph(doc, offer.description, M + 6, y + 21, COL_W - 14, { size: 9, colour: MUTED, leading: 4.4 });
    y += boxH + 6;
  });

  y += 4;
  const btnW = 48;
  const btnX = PAGE_W - M - btnW - 10;
  fillRect(doc, M, y, COL_W, 46, NAVY);
  setText(doc, 14, CREAM, "bold");
  doc.text("Book your free 30-minute walkthrough", M + 10, y + 15);
  setText(doc, 9.5, MUTED_ON_NAVY, "normal");
  doc.text(
    doc.splitTextToSize(
      "We'll go through your roadmap, agree the one thing to fix first, and look at which parts are worth building properly.",
      btnX - M - 20,
    ) as string[],
    M + 10,
    y + 24,
  );

  /* A real button: the pill itself is the link, so it works from a tap as well
     as from the address printed under it. */
  const btnY = y + 13;
  doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
  doc.roundedRect(btnX, btnY, btnW, 13, 6.5, 6.5, "F");
  setText(doc, 9.5, NAVY, "bold");
  doc.text("Book your call", btnX + btnW / 2, btnY + 8.4, { align: "center" });
  doc.link(btnX, btnY, btnW, 13, { url: DIAGNOSTIC.bookingUrl });
  setText(doc, 6.5, MUTED_ON_NAVY, "normal");
  doc.text(
    doc.splitTextToSize(DIAGNOSTIC.bookingUrl, btnW + 8) as string[],
    btnX + btnW / 2,
    btnY + 18,
    { align: "center" },
  );

  y += 56;
  setText(doc, 9.5, INK, "normal");
  const offsetLines = doc.splitTextToSize(
    `If you'd like help putting it in place, your ${DIAGNOSTIC.currencySymbol}${DIAGNOSTIC.tiers[0].price} comes off any system or partnership you book within 30 days.`,
    COL_W - 16,
  ) as string[];
  fillRect(doc, M, y, COL_W, 10 + offsetLines.length * 4.6, WARM_GREY);
  doc.text(offsetLines, M + 8, y + 8);
}

function aboutPage(doc: Doc, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "About");

  eyebrow(doc, "About", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text(DIAGNOSTIC.company, M, 40);

  let y = paragraph(
    doc,
    `${DIAGNOSTIC.consultant} helps service business owners fix the journey between "I'm interested" and "I've booked again". Most of them don't have a marketing problem - they have a journey problem: enquiries that go unanswered, follow-ups that never happen, and clients who simply drift away.`,
    M,
    54,
    COL_W,
    { size: 10.5, colour: INK, leading: 5.2 },
  );

  y = paragraph(
    doc,
    "The work is practical: response systems, booking that doesn't lose people, reminders that protect your diary, review engines and retention sequences - built into the business, not handed over as a document.",
    M,
    y + 6,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  y += 12;
  rule(doc, y);
  y += 10;
  eyebrow(doc, "What we do", M, y, FAINT);
  y += 7;
  [
    "Customer journey diagnostics and implementation",
    "AI assistants and automated client communications",
    "Automation and CRM builds for clinics, studios and salons",
    "Websites and booking journeys designed to convert",
    "Reputation, retention and referral systems",
  ].forEach((line) => {
    y = bullet(doc, line, M, y, COL_W, PURPLE) + 2.5;
  });

  y += 10;
  rule(doc, y);
  y += 10;
  eyebrow(doc, "Get in touch", M, y, FAINT);
  y += 8;
  setText(doc, 11, INK, "bold");
  doc.text(DIAGNOSTIC.contactEmail, M, y);
  doc.link(M, y - 4, doc.getTextWidth(DIAGNOSTIC.contactEmail), 6, {
    url: `mailto:${DIAGNOSTIC.contactEmail}`,
  });
  setText(doc, 10, MUTED, "normal");
  doc.text(DIAGNOSTIC.website, M, y + 7);
  doc.link(M, y + 3, doc.getTextWidth(DIAGNOSTIC.website), 6, {
    url: `https://${DIAGNOSTIC.website}`,
  });
  doc.text(DIAGNOSTIC.instagram, M, y + 14);
  doc.text(DIAGNOSTIC.bookingUrl, M, y + 21);
  doc.link(M, y + 17, doc.getTextWidth(DIAGNOSTIC.bookingUrl), 6, {
    url: DIAGNOSTIC.bookingUrl,
  });

  doc.setFillColor(PURPLE[0], PURPLE[1], PURPLE[2]);
  doc.rect(M, PAGE_H - 40, 20, 1.4, "F");
  setText(doc, 8.5, FAINT, "normal");
  doc.text(
    "This report is confidential and prepared solely for the business named on the cover.",
    M,
    PAGE_H - 32,
  );
}
