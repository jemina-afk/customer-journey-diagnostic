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
    doc.text("Add your appointment numbers to see what these gaps cost.", M + 6, y + 15);
    setText(doc, 7.5, MUTED, "normal");
    doc.text(
      "How many appointments you do in a normal week, and what one is worth on average.",
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

  result.priorities.forEach((section, i) => {
    const colour = statusColour(section.status);
    const summary = section.gaps[0] ?? section.verdict;
    const lines = doc.splitTextToSize(summary, COL_W - 16) as string[];
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
    "The next page maps all eight stages of your journey. From there, each stage has a page of its own: what's working, what's missing, and exactly what to do about it - followed by your 90-day focus cycle.",
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
  y = paragraph(
    doc,
    `Track the following data: ${lowerFirst(cycle.measure.what)}`,
    M,
    y + 8,
    COL_W,
    { size: 10, colour: INK, leading: 4.9 },
  );
  y += 4;
  setText(doc, 8.5, INK, "bold");
  doc.text("Where to get it", M, y);
  y = paragraph(doc, cycle.measure.where, M, y + 5.5, COL_W, {
    size: 9.5,
    colour: MUTED,
    leading: 4.6,
  });
  y += 4;
  setText(doc, 8.5, INK, "bold");
  doc.text("How often to check", M, y);
  paragraph(doc, cycle.measure.cadence, M, y + 5.5, COL_W, {
    size: 9.5,
    colour: MUTED,
    leading: 4.6,
  });
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
  paragraph(doc, tools.joinedUp, M, sy + 9.5, tierW, { size: 8.5, colour: MUTED, leading: 4 });
}

/* -------------------------------------------------------- week-by-week plan */

interface Phase {
  label: string;
  window: string;
  steps: { stage: string; action: string; effort: Fix["effort"] }[];
}

/*
  One timeline for the quarter. Every recommendation from the roadmap is placed
  in a phase: quick wins first, then the projects behind them, in priority
  order, so the plan reads as one list rather than three separate ones.
*/
function buildPhases(result: DiagnosticResult, roadmap: SectionResult[]): Phase[] {
  const phases: Phase[] = [
    { label: "Phase one", window: "Weeks 1-2", steps: [] },
    { label: "Phase two", window: "Weeks 3-6", steps: [] },
    { label: "Phase three", window: "Weeks 7-12", steps: [] },
  ];

  const seen = new Set<string>();
  const add = (into: number, section: SectionResult, fix: Fix) => {
    if (seen.has(fix.action) || phases[into].steps.length >= 3) return;
    seen.add(fix.action);
    phases[into].steps.push({
      stage: section.shortTitle,
      action: fix.action,
      effort: fix.effort,
    });
  };

  const lead = roadmap[0];
  const rest = roadmap.slice(1);
  const quick = (section: SectionResult) => section.fixes.filter((f) => f.effort === "quick");
  const projects = (section: SectionResult) => section.fixes.filter((f) => f.effort !== "quick");

  /*
    The first fortnight belongs to the stage that is costing the most, and only
    to the parts of it that can be switched on quickly. The quarter then widens:
    the other priorities' quick wins and the lead stage's build in the middle,
    the remaining builds at the end. Three to a phase, because a phase with six
    things in it is a list, not a plan.
  */
  if (lead) quick(lead).forEach((f) => add(0, lead, f));
  rest.forEach((section) => quick(section).forEach((f) => add(0, section, f)));

  if (lead) projects(lead).forEach((f) => add(1, lead, f));
  rest.forEach((section) => quick(section).forEach((f) => add(1, section, f)));

  rest.forEach((section) => projects(section).forEach((f) => add(2, section, f)));
  if (lead) projects(lead).forEach((f) => add(2, lead, f));

  // A phase with nothing in it reads as a gap in the plan rather than a light
  // month, so anything still unplaced fills it.
  phases.forEach((phase, i) => {
    if (phase.steps.length > 0) return;
    const spare = roadmap
      .flatMap((section) => section.fixes.map((fix) => ({ section, fix })))
      .find(({ fix }) => !seen.has(fix.action));
    if (spare) add(i, spare.section, spare.fix);
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
  const phases = buildPhases(result, roadmap);

  eyebrow(doc, "The plan", M, 30, PURPLE);
  setText(doc, 24, INK, { font: DISPLAY });
  doc.text("Week by week", M, 41);
  let y = paragraph(
    doc,
    `Everything from the roadmap, in the order to do it. All of it moves ${result.cycle.kpi}.`,
    M,
    51,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  y += 8;
  phases.forEach((phase, i) => {
    fillCircle(doc, M + 3, y - 1, 3, PURPLE);
    setText(doc, 8, WHITE, "bold");
    doc.text(String(i + 1), M + 3, y + 0.4, { align: "center" });
    setText(doc, 12, INK, "bold");
    doc.text(phase.label, M + 11, y);
    setText(doc, 9, PURPLE, "bold");
    doc.text(phase.window, PAGE_W - M, y, { align: "right" });
    y += 7;

    phase.steps.forEach((step) => {
      setText(doc, 6.5, step.effort === "quick" ? GREEN : PURPLE, {
        weight: "bold",
        charSpace: 0.4,
      });
      doc.text(step.effort === "quick" ? "QUICK WIN" : "PROJECT", M + 11, y);
      setText(doc, 7.5, FAINT, "normal");
      doc.text(step.stage, PAGE_W - M, y, { align: "right" });
      y = paragraph(doc, step.action, M + 11, y + 4.5, COL_W - 22, {
        size: 9.5,
        colour: INK,
        leading: 4.5,
      });
      y += 4;
    });

    if (i < phases.length - 1) {
      rule(doc, y + 1, M + 11, COL_W - 11);
      y += 9;
    }
  });

  /*
    Where to start, at the foot. These are phase one's own items rather than a
    separate list, because two lists of first steps on one page is one too many.
  */
  const first = phases[0].steps.slice(0, 3);
  setText(doc, 8.5, INK, "normal");
  const firstH = first.reduce(
    (total, step) => total + (doc.splitTextToSize(step.action, COL_W - 20) as string[]).length * 4.2 + 2,
    0,
  );
  const footY = Math.min(Math.max(y + 8, PAGE_H - 30 - firstH - 16), PAGE_H - 30 - firstH - 16);
  fillRect(doc, M, footY, COL_W, firstH + 16, WARM_GREY);
  setText(doc, 7.5, INK, { weight: "bold", charSpace: 0.6 });
  doc.text("THREE THINGS YOU CAN DO THIS WEEK", M + 8, footY + 9);
  let wy = footY + 16;
  first.forEach((step) => {
    fillCircle(doc, M + 9.2, wy - 1.2, 1, PURPLE);
    wy = paragraph(doc, step.action, M + 13, wy, COL_W - 24, {
      size: 8.5,
      colour: INK,
      leading: 4.2,
    }) + 2;
  });
}

/* ------------------------------------------------- your tracking dashboard */

/*
  An example of what one screen should tell them, drawn with illustrative
  figures rather than their own, because they have not started recording yet.
  Every number on it is marked as an example so it cannot be mistaken for data.
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

  // The focus KPI, large, this month against last.
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

  setText(doc, 26, CREAM, "bold");
  doc.text("18", M + 96, y + 24);
  setText(doc, 7.5, MUTED_ON_NAVY, "normal");
  doc.text("this month", M + 96, y + 30);
  setText(doc, 14, MUTED_ON_NAVY, "bold");
  doc.text("31", M + 118, y + 24);
  setText(doc, 7.5, MUTED_ON_NAVY, "normal");
  doc.text("last month", M + 118, y + 30);
  sparkline(doc, PAGE_W - M - 44, y + 11, 34, 16);
  setText(doc, 7, MUTED_ON_NAVY, "normal");
  doc.text("last 12 weeks", PAGE_W - M - 44, y + 33);
  y += 46;

  // Supporting tiles, drawn from the stages in the roadmap.
  const tiles = roadmap.map((section) => ({
    name: section.kpiName,
    stage: section.shortTitle,
  }));
  const extra = [
    { name: "Enquiries received this month", stage: "Lead Sources" },
    { name: "Appointments booked this month", stage: "Booking" },
    { name: "Clients who came back this month", stage: "Retention" },
  ];
  const all = [...tiles, ...extra].slice(0, 6);

  eyebrow(doc, "Supporting numbers", M, y, FAINT);
  y += 8;
  const tw = (COL_W - 8) / 3;
  all.forEach((tile, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const tx = M + col * (tw + 4);
    const ty = y + row * 24;
    fillRect(doc, tx, ty, tw, 20, WARM_GREY);
    setText(doc, 6.5, FAINT, { weight: "bold", charSpace: 0.4 });
    doc.text(tile.stage.toUpperCase(), tx + 4, ty + 6);
    setText(doc, 8.5, INK, "bold");
    doc.text(doc.splitTextToSize(tile.name, tw - 8).slice(0, 2) as string[], tx + 4, ty + 12);
  });
  y += Math.ceil(all.length / 3) * 24 + 4;

  // What to record, as three short field lists.
  rule(doc, y - 2);
  y += 6;
  eyebrow(doc, "What to record", M, y, PURPLE);
  y = paragraph(
    doc,
    "Three lists is enough. A spreadsheet with three tabs will carry you through the first ninety days; a booking system or a CRM can fill them in for you later. The fields in purple are the ones that feed your focus number.",
    M,
    y + 8,
    COL_W,
    { size: 9, colour: MUTED, leading: 4.3 },
  );

  y += 5;
  const lists: { name: string; fields: { label: string; feeds: boolean }[] }[] = [
    {
      name: "Enquiries",
      fields: [
        { label: "Date received", feeds: true },
        { label: "Where they came from", feeds: true },
        { label: "Time of first reply", feeds: cycle.stage === "Lead Response" },
        { label: "Did they book", feeds: true },
      ],
    },
    {
      name: "Appointments",
      fields: [
        { label: "Date and treatment", feeds: false },
        { label: "New or returning", feeds: cycle.stage === "Retention & Re-engagement" },
        { label: "Attended, cancelled or missed", feeds: cycle.stage === "Reminders & No-Show Prevention" },
        { label: "Rebooked before leaving", feeds: cycle.stage === "Retention & Re-engagement" },
      ],
    },
    {
      name: "Clients",
      fields: [
        { label: "Name and contact", feeds: false },
        { label: "First visit date", feeds: false },
        { label: "Last visit date", feeds: false },
        { label: "Review left", feeds: cycle.stage === "Reviews & Reputation" },
      ],
    },
  ];

  lists.forEach((list, i) => {
    const lx = M + i * (tw + 4);
    setText(doc, 9, INK, "bold");
    doc.text(list.name, lx, y);
    let fy = y + 6;
    list.fields.forEach((field) => {
      const colour = field.feeds ? PURPLE : MUTED;
      fillCircle(doc, lx + 1.2, fy - 1.2, 0.9, colour);
      setText(doc, 8, field.feeds ? INK : MUTED, field.feeds ? "bold" : "normal");
      doc.text(doc.splitTextToSize(field.label, tw - 6) as string[], lx + 4, fy);
      fy += 5.4;
    });
  });
  y += 30;

  // The weekly scoreboard, kept from the old measurement page.
  rule(doc, y);
  y += 8;
  eyebrow(doc, "A scoreboard worth keeping", M, y, FAINT);
  y += 8;
  const cols = ["Week", "Focus number", "Moved?", "What changed"];
  fillRect(doc, M, y - 4, COL_W, 8, WARM_GREY);
  setText(doc, 7.5, INK, "bold");
  const colW = COL_W / cols.length;
  cols.forEach((col, i) => doc.text(col, M + 3 + i * colW, y + 1));
  y += 8;
  setText(doc, 8, MUTED, "normal");
  ["Week 1", "Week 2", "Week 3", "Week 4"].forEach((week) => {
    doc.text(week, M + 3, y);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(M, y + 2.5, PAGE_W - M, y + 2.5);
    y += 7;
  });
}

/** A twelve-week trend line, drawn from an example shape rather than data. */
function sparkline(doc: Doc, x: number, y: number, w: number, h: number) {
  const points = [0.22, 0.3, 0.26, 0.38, 0.44, 0.4, 0.52, 0.6, 0.58, 0.7, 0.78, 0.86];
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
