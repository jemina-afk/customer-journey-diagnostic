/*
  Builds the free lead-magnet guide as a PDF.

    node scripts/build-guide.mjs [out.pdf]

  Drawn with the same palette, type and spacing as the paid report so the two
  read as one product. Vectors rather than a screen capture, so it stays sharp
  and small enough to email.
*/

import { writeFileSync } from "node:fs";
import { jsPDF } from "jspdf";
import {
  BRAND,
  COST,
  FIRST_WEEK,
  MAP_INTRO,
  NEXT,
  STAGES,
  SUBTITLE,
  TITLE,
  WHY,
} from "./guide-content.mjs";

const INK = [32, 27, 24];
const MUTED = [106, 96, 88];
const FAINT = [154, 143, 134];
const LINE = [226, 217, 206];
const CLAY = [190, 96, 68];
const CLAY_SOFT = [246, 232, 225];
const GOLD = [173, 138, 79];
const CANVAS = [250, 247, 243];
const VEIL = [244, 239, 232];
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

function bullet(text, x, y, width, colour) {
  fill(colour);
  doc.circle(x + 1, y - 1.1, 0.8, "F");
  return paragraph(text, x + 4.5, y, width - 4.5, { size: 9, colour: MUTED, leading: 4.2 });
}

function page(label) {
  doc.addPage();
  fill(CANVAS);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  eyebrow(label, M, 14, FAINT);
  setText(7.5, FAINT, "bold");
  doc.text(BRAND.company.toUpperCase(), PAGE_W - M, 14, { align: "right", charSpace: 0.9 });
  rule(18);
}

function money(value) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

/* ------------------------------------------------------------------ cover */

function cover() {
  fill(INK);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Wordmark: the same rotated square as the site, drawn as two triangles.
  fill(CLAY);
  const d = 1.7;
  const cx = M + d;
  const cy = 27.2;
  doc.triangle(cx, cy - d, cx + d, cy, cx, cy + d, "F");
  doc.triangle(cx, cy - d, cx - d, cy, cx, cy + d, "F");
  setText(8, [214, 205, 196], "bold");
  doc.text(BRAND.company.toUpperCase(), M + 7, 29.4, { charSpace: 1.6 });

  eyebrow("A free guide for service business owners", M, 96, CLAY);

  setText(30, WHITE, "bold");
  doc.text("The Eight Stages", M, 116);
  doc.text("of a Customer", M, 130);
  doc.text("Journey", M, 144);

  paragraph(SUBTITLE, M, 158, COL_W - 30, { size: 12, colour: [186, 176, 167], leading: 6 });

  rule(180, M, 34, CLAY);

  const promises = [
    "What each stage is, and why it matters",
    "What goes wrong when it is not set up",
    "What the gaps cost you, at your prices",
    "What to fix, and the number to watch",
  ];
  let y = 194;
  promises.forEach((line) => {
    fill(GOLD);
    doc.circle(M + 1, y - 1.1, 0.9, "F");
    setText(10.5, [214, 205, 196], "normal");
    doc.text(line, M + 5.5, y);
    y += 8;
  });

  setText(9, [138, 128, 120], "normal");
  doc.text(`${BRAND.consultant} · ${BRAND.site}`, M, PAGE_H - 22);
  doc.link(M, PAGE_H - 27, 80, 8, { url: `https://${BRAND.site}` });
}

/* ------------------------------------------------------------ why it matters */

function whyPage() {
  page("Why this matters");

  eyebrow(WHY.eyebrow, M, 30);
  setText(21, INK, "bold");
  doc.text(WHY.title[0], M, 40);
  doc.text(WHY.title[1], M, 49);

  let y = 61;
  WHY.body.forEach((para, i) => {
    y = paragraph(para, M, y, COL_W, {
      size: 10,
      colour: i < 2 ? INK : MUTED,
      leading: 5,
    });
    y += 4;
  });

  y += 2;
  const boxW = (COL_W - 6) / 2;
  WHY.stats.forEach((finding, i) => {
    const x = M + (i % 2) * (boxW + 6);
    const top = y + Math.floor(i / 2) * 50;
    fill(VEIL);
    doc.roundedRect(x, top, boxW, 46, 3, 3, "F");
    setText(24, CLAY, "bold");
    doc.text(finding.stat, x + 5, top + 14);
    let size = 8;
    setText(size, INK, "bold");
    while (doc.getTextWidth(finding.title.toUpperCase()) > boxW - 10 && size > 6.5) {
      size -= 0.25;
      setText(size, INK, "bold");
    }
    doc.text(finding.title.toUpperCase(), x + 5, top + 21, { charSpace: 0.5 });
    paragraph(finding.body, x + 5, top + 27, boxW - 10, { size: 8, colour: MUTED, leading: 3.8 });
  });

  rule(PAGE_H - 38);
  paragraph(WHY.sources, M, PAGE_H - 32, COL_W, { size: 7, colour: FAINT, leading: 3.4 });
}

/* -------------------------------------------------------------- the journey */

function mapPage() {
  page("The eight stages");

  eyebrow("The whole journey on one page", M, 30);
  setText(21, INK, "bold");
  doc.text("Eight steps, from the first", M, 40);
  doc.text("search to the second booking", M, 49);

  let y = 61;
  MAP_INTRO.forEach((para) => {
    y = paragraph(para, M, y, COL_W, { size: 10, colour: INK, leading: 5 });
    y += 4;
  });

  y += 6;
  // A simple descending ladder: each stage a row, indented a little more.
  STAGES.forEach((stage, i) => {
    const top = y + i * 20;
    const indent = M + i * 2.2;
    fill(i % 2 === 0 ? VEIL : CLAY_SOFT);
    doc.roundedRect(indent, top, PAGE_W - M - indent, 16, 2.5, 2.5, "F");

    fill(CLAY);
    doc.circle(indent + 8, top + 8, 4.6, "F");
    setText(9, WHITE, "bold");
    doc.text(String(stage.n), indent + 8, top + 9.4, { align: "center" });

    setText(11, INK, "bold");
    doc.text(stage.title, indent + 17, top + 7);
    setText(8.5, MUTED, "normal");
    doc.text(stage.what, indent + 17, top + 12.4);
  });
}

/* --------------------------------------------------------------- the stages */

/** One stage, drawn as a half-page block. */
function stageBlock(stage, top) {
  const H = 118;

  fill(WHITE);
  doc.roundedRect(M, top, COL_W, H, 3, 3, "F");

  fill(CLAY);
  doc.circle(M + 12, top + 13, 5.4, "F");
  setText(10.5, WHITE, "bold");
  doc.text(String(stage.n), M + 12, top + 14.6, { align: "center" });

  setText(14, INK, "bold");
  doc.text(stage.title, M + 22, top + 12);
  setText(9, MUTED, "normal");
  doc.text(stage.what, M + 22, top + 18.6);

  let y = paragraph(stage.why, M + 8, top + 29, COL_W - 16, {
    size: 9.5,
    colour: INK,
    leading: 4.6,
  });

  rule(y + 3, M + 8, COL_W - 16);

  // Two columns: what goes wrong, and what to do about it.
  const colW = (COL_W - 16 - 8) / 2;
  const colTop = y + 12;

  eyebrow("What goes wrong", M + 8, colTop, [178, 66, 51]);
  let ly = colTop + 7;
  stage.wrong.forEach((line) => {
    ly = bullet(line, M + 8, ly, colW, [178, 66, 51]) + 3;
  });

  eyebrow("What to do", M + 8 + colW + 8, colTop, [62, 122, 96]);
  let ry = colTop + 7;
  stage.fix.forEach((line) => {
    ry = bullet(line, M + 8 + colW + 8, ry, colW, [62, 122, 96]) + 3;
  });

  // The number to watch, pinned to the bottom of the block.
  const footY = top + H - 24;
  fill(VEIL);
  doc.roundedRect(M + 8, footY, COL_W - 16, 20, 2.5, 2.5, "F");
  eyebrow("The number to watch", M + 12, footY + 6, GOLD);
  setText(9, INK, "bold");
  doc.text(stage.kpi, M + 12, footY + 11);
  paragraph(`Where from: ${stage.from}`, M + 12, footY + 15, COL_W - 24, {
    size: 7.5,
    colour: MUTED,
    leading: 3.4,
  });
}

function stagePages() {
  for (let i = 0; i < STAGES.length; i += 2) {
    page(`Stages ${i + 1} and ${i + 2}`);
    stageBlock(STAGES[i], 26);
    stageBlock(STAGES[i + 1], 152);
  }
}

/* ----------------------------------------------------------------- the cost */

function costPage() {
  page("What the gaps cost");

  eyebrow("The bill nobody sends you", M, 30);
  setText(21, INK, "bold");
  doc.text("What the gaps cost, at", M, 40);
  doc.text("your prices", M, 49);

  let y = paragraph(
    "Nobody invoices you for a client who went elsewhere, which is why these gaps stay open for years. Here is what they add up to. The arithmetic is deliberately simple so you can check it.",
    M,
    61,
    COL_W,
    { size: 10, colour: INK, leading: 5 },
  );

  y += 4;
  fill(CLAY_SOFT);
  doc.roundedRect(M, y, COL_W, 14, 2.5, 2.5, "F");
  setText(8.5, INK, "bold");
  doc.text(`Based on: ${COST.basis}`, M + 6, y + 6);
  setText(8.5, MUTED, "normal");
  doc.text(COST.scale, M + 6, y + 11);
  y += 22;

  // Table. First column is the leak and its assumption, then one per price.
  const leakW = 62;
  const cellW = (COL_W - leakW) / COST.columns.length;

  setText(7.5, MUTED, "bold");
  COST.columns.forEach((col, i) => {
    doc.text(col.label.toUpperCase(), M + leakW + cellW * i + cellW - 3, y, {
      align: "right",
      charSpace: 0.4,
    });
  });
  y += 4;
  COST.columns.forEach((col, i) => {
    setText(6.5, FAINT, "normal");
    const lines = doc.splitTextToSize(col.example, cellW - 5);
    lines.slice(0, 2).forEach((line, li) => {
      doc.text(line, M + leakW + cellW * i + cellW - 3, y + li * 3, { align: "right" });
    });
  });
  y += 8;
  rule(y);
  y += 7;

  COST.rows.forEach((row) => {
    setText(10, INK, "bold");
    doc.text(row.leak, M, y);
    const assumptionEnd = paragraph(row.assumption, M, y + 4.5, leakW - 6, {
      size: 7.5,
      colour: MUTED,
      leading: 3.4,
    });
    setText(11, INK, "normal");
    COST.columns.forEach((col, i) => {
      doc.text(money(row.multiple * col.price), M + leakW + cellW * i + cellW - 3, y + 1, {
        align: "right",
      });
    });
    y = Math.max(assumptionEnd, y + 8) + 5;
    rule(y - 3.5);
  });

  // Total.
  y += 2;
  fill(INK);
  doc.roundedRect(M, y, COL_W, 17, 2.5, 2.5, "F");
  setText(8, [214, 205, 196], "bold");
  doc.text("LEAKING EVERY YEAR", M + 6, y + 7, { charSpace: 0.9 });
  setText(6.5, [154, 143, 134], "normal");
  doc.text("If all five gaps are open", M + 6, y + 12);
  const total = COST.rows.reduce((sum, r) => sum + r.multiple, 0);
  COST.columns.forEach((col, i) => {
    setText(12, WHITE, "bold");
    doc.text(money(total * col.price), M + leakW + cellW * i + cellW - 3, y + 10.5, {
      align: "right",
    });
  });
  y += 24;

  y = paragraph(COST.note, M, y, COL_W, { size: 9, colour: MUTED, leading: 4.4 });

  // Sit the closing note above the footer rule however the table lands.
  const noteH = 32;
  y = Math.min(y + 10, PAGE_H - 24 - noteH);
  fill(CLAY_SOFT);
  doc.roundedRect(M, y, COL_W, noteH, 3, 3, "F");
  eyebrow("The part that stings", M + 7, y + 8.5);
  paragraph(COST.close, M + 7, y + 15, COL_W - 14, { size: 9, colour: INK, leading: 4.4 });
}

/* ------------------------------------------------------------- first week */

function firstWeekPage() {
  page("Where to start");

  eyebrow("Your first week", M, 30);
  setText(21, INK, "bold");
  doc.text("Five things to do before", M, 40);
  doc.text("you change anything big", M, 49);

  let y = paragraph(FIRST_WEEK.intro, M, 61, COL_W, { size: 10, colour: INK, leading: 5 });

  y += 8;
  FIRST_WEEK.steps.forEach((step) => {
    fill(VEIL);
    doc.roundedRect(M, y, COL_W, 28, 3, 3, "F");
    setText(7.5, CLAY, "bold");
    doc.text(step.day.toUpperCase(), M + 7, y + 8, { charSpace: 0.9 });
    setText(12, INK, "bold");
    doc.text(step.title, M + 7, y + 15.5);
    paragraph(step.body, M + 7, y + 21, COL_W - 14, { size: 8.5, colour: MUTED, leading: 3.9 });
    y += 33;
  });

  y += 2;
  paragraph(FIRST_WEEK.close, M, y, COL_W, { size: 10, colour: INK, leading: 5, weight: "bold" });
}

/* ------------------------------------------------------------------- next */

function nextPage() {
  page("Next step");

  eyebrow("Make it your numbers", M, 30);
  setText(21, INK, "bold");
  doc.text(NEXT.title[0], M, 40);
  doc.text(NEXT.title[1], M, 49);

  let y = 62;
  NEXT.body.forEach((para, i) => {
    y = paragraph(para, M, y, COL_W, { size: 10.5, colour: i === 2 ? INK : MUTED, leading: 5.2 });
    y += 5;
  });

  y += 4;
  fill(WHITE);
  doc.roundedRect(M, y, COL_W, 52, 3, 3, "F");
  eyebrow("The free diagnostic gives you", M + 8, y + 10, GOLD);
  let by = y + 18;
  NEXT.bullets.forEach((line) => {
    by = bullet(line, M + 8, by, COL_W - 16, CLAY) + 3.5;
  });
  y += 60;

  // The call to action.
  fill(CLAY);
  doc.roundedRect(M, y, COL_W, 28, 4, 4, "F");
  setText(13, WHITE, "bold");
  doc.text("Start your free diagnostic", PAGE_W / 2, y + 12, { align: "center" });
  setText(9.5, [252, 234, 227], "normal");
  doc.text(BRAND.diagnosticUrl, PAGE_W / 2, y + 20, { align: "center" });
  doc.link(M, y, COL_W, 28, { url: `https://${BRAND.diagnosticUrl}` });
  y += 38;

  rule(y);
  y += 9;
  eyebrow("Who wrote this", M, y, FAINT);
  y = paragraph(NEXT.about, M, y + 7, COL_W, { size: 9.5, colour: MUTED, leading: 4.6 });
  y += 5;
  setText(9, INK, "bold");
  doc.text(`${BRAND.consultant} · ${BRAND.company}`, M, y);
  setText(9, MUTED, "normal");
  doc.text(`${BRAND.email} · ${BRAND.site}`, M, y + 5);
}

/* ------------------------------------------------------------- page numbers */

function paginate() {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    rule(PAGE_H - 16);
    setText(7.5, FAINT, "normal");
    doc.text(TITLE, M, PAGE_H - 11);
    doc.text(`${i} / ${total}`, PAGE_W - M, PAGE_H - 11, { align: "right" });
  }
}

/* -------------------------------------------------------------------- build */

cover();
whyPage();
mapPage();
stagePages();
costPage();
firstWeekPage();
nextPage();
paginate();

const out = process.argv[2] ?? "customer-journey-guide.pdf";
writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log(`${out} · ${doc.getNumberOfPages()} pages`);
