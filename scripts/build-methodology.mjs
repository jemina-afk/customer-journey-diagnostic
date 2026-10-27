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
  AMBER,
  COL_W,
  CREAM,
  DISPLAY,
  FAINT,
  GREEN,
  INK,
  LILAC,
  LINE,
  M,
  MUTED,
  MUTED_ON_NAVY,
  NAVY,
  OFF_WHITE,
  PAGE_H,
  PAGE_W,
  PURPLE,
  RED,
  SERIF,
  WARM_GREY,
  WHITE,
  gradientPage,
  helpers,
  registerFonts,
} from "./lib/brand.mjs";
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

const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
doc.setLineJoin("round");
doc.setLineCap("round");
registerFonts(doc);

const { setText, paragraph, title, label, rule, fill, panel, bullet, placeLogo } = helpers(doc);

/* ---------------------------------------------------------------- helpers */

/** Opens a page and draws its section label and Italiana title. */
function page(runningHead, labelText, titleLines, size = 28) {
  doc.addPage();
  panel(0, 0, PAGE_W, PAGE_H, OFF_WHITE);
  setText(8.5, FAINT);
  // The running head is dropped where it would only repeat the section label.
  if (runningHead.toLowerCase() !== labelText.toLowerCase()) doc.text(runningHead, M, 15);
  doc.text(META.company, PAGE_W - M, 15, { align: "right" });
  rule(19);

  label(labelText, M, 32);
  return title(titleLines, M, 48, size) + 4;
}

/** A formula, set apart on warm grey so it reads as something to check. */
function formula(text, y) {
  panel(M, y, COL_W, 13, WARM_GREY);
  fill(PURPLE);
  doc.rect(M, y, 1.6, 13, "F");
  setText(9.5, INK, { weight: "bold" });
  doc.text(text, PAGE_W / 2, y + 8.2, { align: "center" });
  return y + 13;
}

/* ------------------------------------------------------------------ cover */

function cover() {
  gradientPage(doc);
  placeLogo(M, 24, 13, "light");

  label("Technical documentation", M, 104, { tone: "light" });
  title([META.title], M, 128, 30, WHITE, 14);
  title([META.subtitle], M, 146, 30, LILAC, 14);

  paragraph(META.strap, M, 168, COL_W - 42, {
    size: 12,
    colour: CREAM,
    font: SERIF,
    leading: 6.4,
  });

  const contents = [
    "What it measures, and how the stages are weighted",
    "How an answer becomes a score",
    "How priorities and the 90-day cycle are chosen",
    "The money model in full, including every cap",
    "What the model deliberately does not do",
  ];
  let y = 196;
  contents.forEach((line) => {
    fill(LILAC);
    doc.circle(M + 1, y - 1.1, 0.8, "F");
    setText(10, CREAM);
    doc.text(line, M + 6, y);
    y += 8;
  });

  setText(9, MUTED_ON_NAVY);
  doc.text(`${META.consultant} \u00b7 ${META.company}`, M, PAGE_H - 24);
  doc.text(META.version, PAGE_W - M, PAGE_H - 24, { align: "right" });
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
    fill(WARM_GREY);
    doc.rect(x, y, boxW, 30, "F");
    setText(22, INK, { weight: "bold" });
    doc.text(fact.k, x + boxW / 2, y + 15, { align: "center" });
    setText(7.5, MUTED);
    const lines = doc.splitTextToSize(fact.v, boxW - 6);
    lines.forEach((line, li) => doc.text(line, x + boxW / 2, y + 21 + li * 3.4, { align: "center" }));
  });
  y += 40;

  fill(WARM_GREY);
  doc.rect(M, y, COL_W, 30, "F");
  label("Who this is for", M + 7, y + 9, { size: 8 });
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
  setText(7, MUTED, { weight: "bold" });
  doc.text("STAGE", M, y, { charSpace: 0.5 });
  doc.text("WEIGHT", M + 76, y, { align: "right", charSpace: 0.5 });
  doc.text("Q", M + 86, y, { align: "right", charSpace: 0.5 });
  doc.text("WHY", M + 92, y, { charSpace: 0.5 });
  y += 3;
  rule(y);
  y += 6;

  STRUCTURE.weights.forEach((row) => {
    setText(9.5, INK, { weight: "bold" });
    doc.text(row.stage, M, y);
    setText(10, INK, { weight: "bold" });
    doc.text(row.weight, M + 76, y, { align: "right" });
    setText(9, FAINT);
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
    fill(WARM_GREY);
    const h = 26;
    doc.rect(M, y, COL_W, h, "F");
    setText(11, INK, { weight: "bold" });
    doc.text(k.kind, M + 7, y + 9);
    setText(8, INK, { weight: "bold" });
    doc.text(k.count.toUpperCase(), PAGE_W - M - 7, y + 9, { align: "right", charSpace: 0.5 });
    paragraph(k.how, M + 7, y + 15, COL_W - 14, { size: 8.5, colour: MUTED, leading: 3.9 });
    y += h + 5;
  });

  y += 2;
  fill(WARM_GREY);
  doc.rect(M, y, COL_W, 30, "F");
  label(QUESTION_SCORING.unknown.title, M + 7, y + 9, { size: 8 });
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
    fill(PURPLE);
    doc.circle(M + 4, y + 1, 4, "F");
    setText(8.5, WHITE, { weight: "bold" });
    doc.text(step.n, M + 4, y + 2.4, { align: "center" });
    setText(12, INK, { weight: "bold" });
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
  label(ROLLUP.statusTitle, M, top, { size: 8 });
  let ly = top + 7;
  ROLLUP.status.forEach((row, i) => {
    const colour = i === 0 ? GREEN : i === 1 ? AMBER : RED;
    fill(colour);
    doc.circle(M + 1.6, ly - 1.2, 1.6, "F");
    setText(9.5, INK, { weight: "bold" });
    doc.text(row.label, M + 6, ly);
    setText(9, FAINT);
    doc.text(row.range, M + colW, ly, { align: "right" });
    ly = paragraph(row.note, M + 6, ly + 4, colW - 6, { size: 8, colour: MUTED, leading: 3.6 }) + 4;
  });

  const rx = M + colW + 8;
  label(ROLLUP.bandTitle, rx, top, { size: 8 });
  let ry = top + 7;
  ROLLUP.bands.forEach((row) => {
    setText(9.5, INK, { weight: "bold" });
    doc.text(row.label, rx, ry);
    setText(9, FAINT);
    doc.text(row.range, rx + colW, ry, { align: "right" });
    ry += 4;
    rule(ry - 1.5, rx, colW);
    ry += 5;
  });
  setText(8, MUTED);
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
  fill(WARM_GREY);
  doc.rect(M, y, COL_W, 74, "F");
  label("Worked example", M + 7, y + 9, { size: 8 });
  setText(9, MUTED);
  doc.text("From the sample report. The stage with the lowest score is not the top priority.", M + 7, y + 15);

  const rows = [
    { stage: "Lead Response", score: 28, weight: "1.3", opp: 94, lead: true },
    { stage: "Retention & Re-engagement", score: 46, weight: "1.2", opp: 65, lead: false },
    { stage: "Reviews & Reputation", score: 41, weight: "1.0", opp: 59, lead: false },
    { stage: "Reminders & No-Show Prevention", score: 56, weight: "1.25", opp: 55, lead: false },
  ];
  let ty = y + 25;
  setText(7, MUTED, { weight: "bold" });
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
    setText(9.5, MUTED);
    doc.text(String(row.score), M + 112, ty, { align: "right" });
    doc.text(row.weight, M + 133, ty, { align: "right" });
    setText(10, row.lead ? INK : MUTED, { weight: "bold" });
    doc.text(String(row.opp), PAGE_W - M - 7, ty, { align: "right" });
    ty += 9;
  });
  setText(8, MUTED);
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
    setText(11, INK, { weight: "bold" });
    doc.text(leak.name, M, y);
    y += 5;
    fill(WARM_GREY);
    doc.rect(M, y, COL_W, 9, "F");
    setText(9, INK, { weight: "bold" });
    doc.text(leak.formula, M + 6, y + 6);
    y += 13;
    y = paragraph(leak.why, M, y, COL_W, { size: 8.8, colour: MUTED, leading: 4.1 });
    y += 7;
  });
}

function capsPage() {
  let y = page("The money model", "Restraint by design", ["Caps, floors and", "rounding"]);
  y += 6;

  label(MONEY.capsTitle, M, y, { size: 8 });
  y += 8;
  const boxW = (COL_W - 9) / 4;
  MONEY.caps.forEach((cap, i) => {
    const x = M + i * (boxW + 3);
    fill(WARM_GREY);
    doc.rect(x, y, boxW, 34, "F");
    setText(16, INK, { weight: "bold" });
    doc.text(cap.k, x + boxW / 2, y + 13, { align: "center" });
    setText(7.5, MUTED);
    const lines = doc.splitTextToSize(cap.v, boxW - 6);
    lines.slice(0, 4).forEach((line, li) =>
      doc.text(line, x + boxW / 2, y + 19 + li * 3.4, { align: "center" }),
    );
  });
  y += 42;

  y = paragraph(MONEY.capNote, M, y, COL_W, { size: 9.5, colour: INK, leading: 4.8 });
  y += 12;

  label(MONEY.bandsTitle, M, y, { size: 8 });
  y += 8;
  setText(7, MUTED, { weight: "bold" });
  doc.text("BAND", M, y, { charSpace: 0.5 });
  doc.text("MIDPOINT USED", M + 80, y, { align: "right", charSpace: 0.5 });
  y += 3;
  rule(y);
  y += 6;
  MONEY.bands.forEach((row) => {
    setText(10, INK);
    doc.text(row.band, M, y);
    setText(10, INK, { weight: "bold" });
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
    fill(PURPLE);
    doc.circle(M + 4, y + 1, 4, "F");
    setText(8.5, WHITE, { weight: "bold" });
    doc.text(step.n, M + 4, y + 2.4, { align: "center" });
    setText(11, INK, { weight: "bold" });
    doc.text(step.title, M + 12, y + 2.5);
    y = paragraph(step.body, M + 12, y + 8, COL_W - 12, {
      size: 9,
      colour: MUTED,
      leading: 4.3,
    });
    y += 8;
  });

  y += 2;
  fill(WARM_GREY);
  doc.rect(M, y, COL_W, 24, "F");
  label("What the KPI is worth", M + 7, y + 9, { size: 8 });
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
  fill(WARM_GREY);
  doc.rect(M, y, COL_W, 54, "F");
  label("Example: the Lead Response KPI", M + 7, y + 9, { size: 8 });
  setText(12, INK, { weight: "bold" });
  doc.text(MEASUREMENT.example.kpi, M + 7, y + 17);
  let ey = paragraph(MEASUREMENT.example.what, M + 7, y + 24, COL_W - 14, {
    size: 9,
    colour: INK,
    leading: 4.3,
  });
  ey += 2;
  setText(8.5, INK, { weight: "bold" });
  doc.text("Where from:", M + 7, ey);
  ey = paragraph(MEASUREMENT.example.where, M + 27, ey, COL_W - 34, {
    size: 8.5,
    colour: MUTED,
    leading: 4,
  });
  ey += 2;
  setText(8.5, INK, { weight: "bold" });
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
    fill(PURPLE);
    doc.rect(M, y - 3.5, 1.4, 5, "F");
    setText(11, INK, { weight: "bold" });
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
    fill(WARM_GREY);
    doc.rect(M, y, COL_W, 24, "F");
    setText(10.5, INK, { weight: "bold" });
    doc.text(row.stat, M + 7, y + 9);
    paragraph(row.cite, M + 7, y + 15, COL_W - 14, { size: 8, colour: MUTED, leading: 3.8 });
    y += 29;
  });

  y += 2;
  fill(WARM_GREY);
  doc.rect(M, y, COL_W, 26, "F");
  paragraph(SOURCES.close, M + 7, y + 10, COL_W - 14, { size: 9.5, colour: INK, leading: 4.6 });
  y += 36;

  rule(y);
  y += 9;
  label("Questions about any of this", M, y, { size: 8 });
  setText(10, INK, { weight: "bold" });
  doc.text(`${META.consultant} · ${META.company}`, M, y + 8);
  setText(9.5, MUTED);
  doc.text(`${META.email} · ${META.site}`, M, y + 14);
}

/* ------------------------------------------------------------- page numbers */

function paginate() {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    rule(PAGE_H - 16);
    setText(7.5, FAINT);
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
