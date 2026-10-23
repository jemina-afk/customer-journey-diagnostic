/*
  Builds the methodology document as a PDF.

    node scripts/build-methodology.mjs [out.pdf]

  Same palette and type as the report and the guide. This one is for people who
  want to know whether to believe the numbers: prospects doing due diligence,
  partners considering a white-label, and Jemina herself on a call.
*/

import { writeFileSync } from "node:fs";
import { jsPDF } from "jspdf";
import {
  CYCLE,
  INTRO,
  LIMITS,
  MEASUREMENT,
  META,
  MONEY,
  PRIORITIES,
  QUESTION_SCORING,
  ROLLUP,
  SOURCES,
  STRUCTURE,
} from "./methodology-content.mjs";

const INK = [32, 27, 24];
const MUTED = [106, 96, 88];
const FAINT = [154, 143, 134];
const LINE = [226, 217, 206];
const CLAY = [190, 96, 68];
const CLAY_SOFT = [246, 232, 225];
const GOLD = [173, 138, 79];
const CANVAS = [250, 247, 243];
const VEIL = [244, 239, 232];
const GREEN = [62, 122, 96];
const AMBER = [191, 141, 51];
const RED = [178, 66, 51];
const WHITE = [255, 255, 255];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 20;
const COL_W = PAGE_W - M * 2;

const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
doc.setLineJoin("round");
doc.setLineCap("round");

/* ---------------------------------------------------------------- helpers */

function setText(size, colour, weight = "normal") {
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  doc.setTextColor(colour[0], colour[1], colour[2]);
  // charSpace is stateful in jsPDF, so an earlier tracked line would leak into
  // this one. Reset it; callers that want tracking pass it per call.
  doc.setCharSpace(0);
}

function paragraph(text, x, y, width, opts = {}) {
  const size = opts.size ?? 10;
  const leading = opts.leading ?? size * 0.52;
  setText(size, opts.colour ?? MUTED, opts.weight ?? "normal");
  const lines = doc.splitTextToSize(text, width);
  lines.forEach((line, i) => doc.text(line, x, y + i * leading));
  return y + lines.length * leading;
}

function eyebrow(text, x, y, colour = CLAY) {
  setText(7.5, colour, "bold");
  doc.text(text.toUpperCase(), x, y, { charSpace: 0.9 });
}

function rule(y, x = M, w = COL_W, colour = LINE) {
  doc.setDrawColor(colour[0], colour[1], colour[2]);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y);
}

function fill(colour) {
  doc.setFillColor(colour[0], colour[1], colour[2]);
}

/** Opens a page and draws its two-line heading. Returns the y to carry on from. */
function page(label, eyebrowText, titleLines) {
  doc.addPage();
  fill(CANVAS);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  eyebrow(label, M, 14, FAINT);
  setText(7.5, FAINT, "bold");
  doc.text(META.company.toUpperCase(), PAGE_W - M, 14, { align: "right", charSpace: 0.9 });
  rule(18);

  eyebrow(eyebrowText, M, 30);
  setText(21, INK, "bold");
  titleLines.forEach((line, i) => doc.text(line, M, 40 + i * 9));
  return 40 + titleLines.length * 9 + 3;
}

/** A monospaced-feeling formula strip. */
function formula(text, y, colour = CLAY_SOFT) {
  fill(colour);
  doc.roundedRect(M, y, COL_W, 12, 2.5, 2.5, "F");
  setText(10, INK, "bold");
  doc.text(text, PAGE_W / 2, y + 7.6, { align: "center" });
  return y + 12;
}

/* ------------------------------------------------------------------ cover */

function cover() {
  fill(INK);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  fill(CLAY);
  const d = 1.7;
  const cx = M + d;
  const cy = 27.2;
  doc.triangle(cx, cy - d, cx + d, cy, cx, cy + d, "F");
  doc.triangle(cx, cy - d, cx - d, cy, cx, cy + d, "F");
  setText(8, [214, 205, 196], "bold");
  doc.text(META.company.toUpperCase(), M + 7, 29.4, { charSpace: 1.6 });

  eyebrow("Technical documentation", M, 100, CLAY);
  setText(30, WHITE, "bold");
  doc.text(META.title, M, 122);
  setText(30, [166, 156, 148], "bold");
  doc.text(META.subtitle, M, 138);

  paragraph(META.strap, M, 154, COL_W - 40, { size: 12, colour: [186, 176, 167], leading: 6 });

  rule(176, M, 34, CLAY);

  const contents = [
    "What it measures, and how the stages are weighted",
    "How an answer becomes a score",
    "How priorities and the 90-day cycle are chosen",
    "The money model in full, including every cap",
    "What the model deliberately does not do",
  ];
  let y = 190;
  contents.forEach((line) => {
    fill(GOLD);
    doc.circle(M + 1, y - 1.1, 0.9, "F");
    setText(10, [214, 205, 196], "normal");
    doc.text(line, M + 5.5, y);
    y += 7.5;
  });

  rule(PAGE_H - 34, M, COL_W, [70, 62, 56]);
  setText(9, [138, 128, 120], "normal");
  doc.text(`${META.consultant} · ${META.company}`, M, PAGE_H - 26);
  doc.text(META.version, PAGE_W - M, PAGE_H - 26, { align: "right" });
}

/* ------------------------------------------------------------------ pages */

function introPage() {
  let y = page("Introduction", INTRO.eyebrow, INTRO.title);
  y += 8;
  INTRO.body.forEach((para, i) => {
    y = paragraph(para, M, y, COL_W, { size: 10.5, colour: i === 0 ? INK : MUTED, leading: 5.4 });
    y += 5;
  });

  y += 6;
  const boxW = (COL_W - 9) / 4;
  INTRO.facts.forEach((fact, i) => {
    const x = M + i * (boxW + 3);
    fill(VEIL);
    doc.roundedRect(x, y, boxW, 30, 3, 3, "F");
    setText(22, CLAY, "bold");
    doc.text(fact.k, x + boxW / 2, y + 15, { align: "center" });
    setText(7.5, MUTED, "normal");
    const lines = doc.splitTextToSize(fact.v, boxW - 6);
    lines.forEach((line, li) => doc.text(line, x + boxW / 2, y + 21 + li * 3.4, { align: "center" }));
  });
  y += 40;

  fill(CLAY_SOFT);
  doc.roundedRect(M, y, COL_W, 30, 3, 3, "F");
  eyebrow("Who this is for", M + 7, y + 9);
  paragraph(
    "Anyone deciding whether to trust the output: a business owner weighing up the report, a partner considering a branded version, or an adviser being handed one of these by a client.",
    M + 7,
    y + 16,
    COL_W - 14,
    { size: 9.5, colour: INK, leading: 4.6 },
  );
}

function structurePage() {
  let y = page("What it measures", STRUCTURE.eyebrow, STRUCTURE.title);
  y += 6;
  STRUCTURE.body.forEach((para) => {
    y = paragraph(para, M, y, COL_W, { size: 10, colour: MUTED, leading: 5 });
    y += 4;
  });

  y += 4;
  setText(7, MUTED, "bold");
  doc.text("STAGE", M, y, { charSpace: 0.5 });
  doc.text("WEIGHT", M + 76, y, { align: "right", charSpace: 0.5 });
  doc.text("Q", M + 86, y, { align: "right", charSpace: 0.5 });
  doc.text("WHY", M + 92, y, { charSpace: 0.5 });
  y += 3;
  rule(y);
  y += 6;

  STRUCTURE.weights.forEach((row) => {
    setText(9.5, INK, "bold");
    doc.text(row.stage, M, y);
    setText(10, CLAY, "bold");
    doc.text(row.weight, M + 76, y, { align: "right" });
    setText(9, FAINT, "normal");
    doc.text(String(row.questions), M + 86, y, { align: "right" });
    const end = paragraph(row.note, M + 92, y - 0.5, COL_W - 92, {
      size: 8,
      colour: MUTED,
      leading: 3.6,
    });
    y = Math.max(end, y + 5) + 4;
    rule(y - 2.5);
  });

  y += 4;
  paragraph(STRUCTURE.note, M, y, COL_W, { size: 9, colour: MUTED, leading: 4.4 });
}

function questionPage() {
  let y = page("Scoring an answer", QUESTION_SCORING.eyebrow, QUESTION_SCORING.title);
  y += 6;
  y = paragraph(QUESTION_SCORING.body[0], M, y, COL_W, { size: 10, colour: MUTED, leading: 5 });
  y += 8;

  QUESTION_SCORING.kinds.forEach((k) => {
    fill(VEIL);
    const h = 26;
    doc.roundedRect(M, y, COL_W, h, 3, 3, "F");
    setText(11, INK, "bold");
    doc.text(k.kind, M + 7, y + 9);
    setText(8, CLAY, "bold");
    doc.text(k.count.toUpperCase(), PAGE_W - M - 7, y + 9, { align: "right", charSpace: 0.5 });
    paragraph(k.how, M + 7, y + 15, COL_W - 14, { size: 8.5, colour: MUTED, leading: 3.9 });
    y += h + 5;
  });

  y += 2;
  fill(CLAY_SOFT);
  doc.roundedRect(M, y, COL_W, 30, 3, 3, "F");
  eyebrow(QUESTION_SCORING.unknown.title, M + 7, y + 9);
  paragraph(QUESTION_SCORING.unknown.body, M + 7, y + 16, COL_W - 14, {
    size: 9,
    colour: INK,
    leading: 4.4,
  });
  y += 38;

  paragraph(QUESTION_SCORING.safety, M, y, COL_W, { size: 9, colour: MUTED, leading: 4.4 });
}

function rollupPage() {
  let y = page("From answers to scores", ROLLUP.eyebrow, ROLLUP.title);
  y += 8;

  ROLLUP.steps.forEach((step) => {
    fill(CLAY);
    doc.circle(M + 4, y + 1, 4, "F");
    setText(8.5, WHITE, "bold");
    doc.text(step.n, M + 4, y + 2.4, { align: "center" });
    setText(12, INK, "bold");
    doc.text(step.title, M + 12, y + 3);
    y += 9;
    y = formula(step.formula, y);
    y += 5;
    y = paragraph(step.body, M, y, COL_W, { size: 9.5, colour: MUTED, leading: 4.6 });
    y += 10;
  });

  // Two thresholds tables, side by side.
  const colW = (COL_W - 8) / 2;
  const top = y;
  eyebrow(ROLLUP.statusTitle, M, top, GOLD);
  let ly = top + 7;
  ROLLUP.status.forEach((row, i) => {
    const colour = i === 0 ? GREEN : i === 1 ? AMBER : RED;
    fill(colour);
    doc.circle(M + 1.6, ly - 1.2, 1.6, "F");
    setText(9.5, INK, "bold");
    doc.text(row.label, M + 6, ly);
    setText(9, FAINT, "normal");
    doc.text(row.range, M + colW, ly, { align: "right" });
    ly = paragraph(row.note, M + 6, ly + 4, colW - 6, { size: 8, colour: MUTED, leading: 3.6 }) + 4;
  });

  const rx = M + colW + 8;
  eyebrow(ROLLUP.bandTitle, rx, top, GOLD);
  let ry = top + 7;
  ROLLUP.bands.forEach((row) => {
    setText(9.5, INK, "bold");
    doc.text(row.label, rx, ry);
    setText(9, FAINT, "normal");
    doc.text(row.range, rx + colW, ry, { align: "right" });
    ry += 4;
    rule(ry - 1.5, rx, colW);
    ry += 5;
  });
  setText(8, MUTED, "normal");
  paragraph(
    "The band sets the headline sentence on the cover and the summary page. It does not affect any other part of the report.",
    rx,
    ry + 2,
    colW,
    { size: 8, colour: MUTED, leading: 3.6 },
  );
}

function prioritiesPage() {
  let y = page("Choosing the order", PRIORITIES.eyebrow, PRIORITIES.title);
  y += 6;
  y = paragraph(PRIORITIES.body[0], M, y, COL_W, { size: 10, colour: MUTED, leading: 5 });
  y += 6;
  y = formula(PRIORITIES.formula, y);
  y += 8;
  PRIORITIES.after.forEach((para) => {
    y = paragraph(para, M, y, COL_W, { size: 10, colour: MUTED, leading: 5 });
    y += 5;
  });

  // A worked example, using the sample report's own figures.
  y += 4;
  fill(VEIL);
  doc.roundedRect(M, y, COL_W, 74, 3, 3, "F");
  eyebrow("Worked example", M + 7, y + 9);
  setText(9, MUTED, "normal");
  doc.text("From the sample report. The stage with the lowest score is not the top priority.", M + 7, y + 15);

  const rows = [
    { stage: "Lead Response", score: 28, weight: "1.3", opp: 94, lead: true },
    { stage: "Retention & Re-engagement", score: 46, weight: "1.2", opp: 65, lead: false },
    { stage: "Reviews & Reputation", score: 41, weight: "1.0", opp: 59, lead: false },
    { stage: "Reminders & No-Show Prevention", score: 56, weight: "1.25", opp: 55, lead: false },
  ];
  let ty = y + 25;
  setText(7, MUTED, "bold");
  doc.text("STAGE", M + 7, ty, { charSpace: 0.5 });
  doc.text("SCORE", M + 112, ty, { align: "right", charSpace: 0.5 });
  doc.text("WEIGHT", M + 133, ty, { align: "right", charSpace: 0.5 });
  doc.text("OPPORTUNITY", PAGE_W - M - 7, ty, { align: "right", charSpace: 0.5 });
  ty += 3;
  rule(ty, M + 7, COL_W - 14);
  ty += 7;
  rows.forEach((row) => {
    setText(9.5, INK, row.lead ? "bold" : "normal");
    doc.text(row.stage, M + 7, ty);
    setText(9.5, MUTED, "normal");
    doc.text(String(row.score), M + 112, ty, { align: "right" });
    doc.text(row.weight, M + 133, ty, { align: "right" });
    setText(10, row.lead ? CLAY : MUTED, "bold");
    doc.text(String(row.opp), PAGE_W - M - 7, ty, { align: "right" });
    ty += 9;
  });
  setText(8, MUTED, "normal");
  doc.text(
    "Reviews scores 41 and Retention 46, yet Retention ranks higher: its weight is greater.",
    M + 7,
    y + 68,
  );
}

function moneyPage() {
  let y = page("The money model", MONEY.eyebrow, MONEY.title);
  y += 6;
  MONEY.body.forEach((para, i) => {
    y = paragraph(para, M, y, COL_W, { size: 10, colour: i === 0 ? INK : MUTED, leading: 5 });
    y += 4;
  });

  y += 4;
  MONEY.leaks.forEach((leak) => {
    setText(11, INK, "bold");
    doc.text(leak.name, M, y);
    y += 5;
    fill(VEIL);
    doc.roundedRect(M, y, COL_W, 9, 2, 2, "F");
    setText(9, CLAY, "bold");
    doc.text(leak.formula, M + 6, y + 6);
    y += 13;
    y = paragraph(leak.why, M, y, COL_W, { size: 8.8, colour: MUTED, leading: 4.1 });
    y += 7;
  });
}

function capsPage() {
  let y = page("The money model", "Restraint by design", ["Caps, floors and", "rounding"]);
  y += 6;

  eyebrow(MONEY.capsTitle, M, y, GOLD);
  y += 8;
  const boxW = (COL_W - 9) / 4;
  MONEY.caps.forEach((cap, i) => {
    const x = M + i * (boxW + 3);
    fill(CLAY_SOFT);
    doc.roundedRect(x, y, boxW, 34, 3, 3, "F");
    setText(16, CLAY, "bold");
    doc.text(cap.k, x + boxW / 2, y + 13, { align: "center" });
    setText(7.5, MUTED, "normal");
    const lines = doc.splitTextToSize(cap.v, boxW - 6);
    lines.slice(0, 4).forEach((line, li) =>
      doc.text(line, x + boxW / 2, y + 19 + li * 3.4, { align: "center" }),
    );
  });
  y += 42;

  y = paragraph(MONEY.capNote, M, y, COL_W, { size: 9.5, colour: INK, leading: 4.8 });
  y += 12;

  eyebrow(MONEY.bandsTitle, M, y, GOLD);
  y += 8;
  setText(7, MUTED, "bold");
  doc.text("BAND", M, y, { charSpace: 0.5 });
  doc.text("MIDPOINT USED", M + 80, y, { align: "right", charSpace: 0.5 });
  y += 3;
  rule(y);
  y += 6;
  MONEY.bands.forEach((row) => {
    setText(10, INK, "normal");
    doc.text(row.band, M, y);
    setText(10, CLAY, "bold");
    doc.text(row.mid, M + 80, y, { align: "right" });
    y += 4;
    rule(y - 1.5, M, 80);
    y += 5;
  });

  y += 4;
  paragraph(MONEY.bandNote, M, y, COL_W, { size: 9, colour: MUTED, leading: 4.4 });
}

function cyclePage() {
  let y = page("The 90-day plan", CYCLE.eyebrow, CYCLE.title);
  y += 6;
  y = paragraph(CYCLE.body[0], M, y, COL_W, { size: 10, colour: MUTED, leading: 5 });
  y += 8;

  CYCLE.steps.forEach((step) => {
    fill(CLAY);
    doc.circle(M + 4, y + 1, 4, "F");
    setText(8.5, WHITE, "bold");
    doc.text(step.n, M + 4, y + 2.4, { align: "center" });
    setText(11, INK, "bold");
    doc.text(step.title, M + 12, y + 2.5);
    y = paragraph(step.body, M + 12, y + 8, COL_W - 12, {
      size: 9,
      colour: MUTED,
      leading: 4.3,
    });
    y += 8;
  });

  y += 2;
  fill(VEIL);
  doc.roundedRect(M, y, COL_W, 24, 3, 3, "F");
  eyebrow("What the KPI is worth", M + 7, y + 9, GOLD);
  paragraph(CYCLE.worth, M + 7, y + 15, COL_W - 14, { size: 9, colour: INK, leading: 4.3 });
}

function measurementPage() {
  let y = page("Measurement", MEASUREMENT.eyebrow, MEASUREMENT.title);
  y += 6;
  MEASUREMENT.body.forEach((para) => {
    y = paragraph(para, M, y, COL_W, { size: 10, colour: MUTED, leading: 5 });
    y += 5;
  });

  y += 5;
  fill(VEIL);
  doc.roundedRect(M, y, COL_W, 54, 3, 3, "F");
  eyebrow("Example: the Lead Response KPI", M + 7, y + 9);
  setText(12, INK, "bold");
  doc.text(MEASUREMENT.example.kpi, M + 7, y + 17);
  let ey = paragraph(MEASUREMENT.example.what, M + 7, y + 24, COL_W - 14, {
    size: 9,
    colour: INK,
    leading: 4.3,
  });
  ey += 2;
  setText(8.5, CLAY, "bold");
  doc.text("Where from:", M + 7, ey);
  ey = paragraph(MEASUREMENT.example.where, M + 27, ey, COL_W - 34, {
    size: 8.5,
    colour: MUTED,
    leading: 4,
  });
  ey += 2;
  setText(8.5, CLAY, "bold");
  doc.text("How often:", M + 7, ey);
  paragraph(MEASUREMENT.example.cadence, M + 27, ey, COL_W - 34, {
    size: 8.5,
    colour: MUTED,
    leading: 4,
  });
  y += 62;

  paragraph(MEASUREMENT.note, M, y, COL_W, { size: 9.5, colour: INK, leading: 4.8 });
}

function limitsPage() {
  let y = page("Limits", LIMITS.eyebrow, LIMITS.title);
  y += 8;
  LIMITS.items.forEach((item) => {
    fill(CLAY);
    doc.rect(M, y - 3.5, 1.4, 5, "F");
    setText(11, INK, "bold");
    doc.text(item.title, M + 6, y);
    y = paragraph(item.body, M + 6, y + 6, COL_W - 6, { size: 9.2, colour: MUTED, leading: 4.4 });
    y += 9;
  });
}

function sourcesPage() {
  let y = page("Evidence", SOURCES.eyebrow, SOURCES.title);
  y += 6;
  y = paragraph(SOURCES.body, M, y, COL_W, { size: 10, colour: MUTED, leading: 5 });
  y += 8;

  SOURCES.list.forEach((row) => {
    fill(VEIL);
    doc.roundedRect(M, y, COL_W, 24, 3, 3, "F");
    setText(10.5, CLAY, "bold");
    doc.text(row.stat, M + 7, y + 9);
    paragraph(row.cite, M + 7, y + 15, COL_W - 14, { size: 8, colour: MUTED, leading: 3.8 });
    y += 29;
  });

  y += 2;
  fill(CLAY_SOFT);
  doc.roundedRect(M, y, COL_W, 26, 3, 3, "F");
  paragraph(SOURCES.close, M + 7, y + 10, COL_W - 14, { size: 9.5, colour: INK, leading: 4.6 });
  y += 36;

  rule(y);
  y += 9;
  eyebrow("Questions about any of this", M, y, FAINT);
  setText(10, INK, "bold");
  doc.text(`${META.consultant} · ${META.company}`, M, y + 8);
  setText(9.5, MUTED, "normal");
  doc.text(`${META.email} · ${META.site}`, M, y + 14);
}

/* ------------------------------------------------------------- page numbers */

function paginate() {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    rule(PAGE_H - 16);
    setText(7.5, FAINT, "normal");
    doc.text(`${META.title} · ${META.subtitle} · ${META.version}`, M, PAGE_H - 11);
    doc.text(`${i} / ${total}`, PAGE_W - M, PAGE_H - 11, { align: "right" });
  }
}

/* -------------------------------------------------------------------- build */

cover();
introPage();
structurePage();
questionPage();
rollupPage();
prioritiesPage();
moneyPage();
capsPage();
cyclePage();
measurementPage();
limitsPage();
sourcesPage();
paginate();

const out = process.argv[2] ?? "customer-journey-diagnostic-methodology.pdf";
writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log(`${out} · ${doc.getNumberOfPages()} pages`);
