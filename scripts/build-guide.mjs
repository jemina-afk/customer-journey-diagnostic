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
  AMBER,
  COL_W,
  CREAM,
  DISPLAY,
  FAINT,
  GREEN,
  INK,
  LABEL_GREY,
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

const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
doc.setLineJoin("round");
doc.setLineCap("round");
registerFonts(doc);

const { setText, paragraph, title, label, rule, fill, panel, bullet, placeLogo } = helpers(doc);

/* ---------------------------------------------------------------- helpers */

/** Opens a light page with the running head. */
function page(runningHead) {
  doc.addPage();
  panel(0, 0, PAGE_W, PAGE_H, OFF_WHITE);
  setText(8.5, FAINT);
  doc.text(runningHead, M, 15);
  doc.text(BRAND.company, PAGE_W - M, 15, { align: "right" });
  rule(19);
}

/** A page heading: section label, then an Italiana title. */
function heading(labelText, titleLines, size = 30) {
  label(labelText, M, 32);
  return title(titleLines, M, 48, size);
}

function money(value) {
  return `\u00a3${Math.round(value).toLocaleString("en-GB")}`;
}

/* ------------------------------------------------------------------ cover */

function cover() {
  // The signature gradient, kept still, with the grain and the white wordmark.
  gradientPage(doc);
  placeLogo(M, 24, 13, "light");

  label("A free guide for service business owners", M, 100, { tone: "light" });
  title(["The eight stages of", "a customer journey"], M, 126, 36, WHITE, 16);

  paragraph(SUBTITLE, M, 168, COL_W - 34, {
    size: 12,
    colour: LILAC,
    font: SERIF,
    leading: 6.4,
  });

  const promises = [
    "What each stage is, and why it matters",
    "What goes wrong when it is not set up",
    "What the gaps cost you, at your prices",
    "What to fix, and the number to watch",
  ];
  let y = 196;
  promises.forEach((line) => {
    fill(LILAC);
    doc.circle(M + 1, y - 1.1, 0.8, "F");
    setText(10.5, CREAM);
    doc.text(line, M + 6, y);
    y += 8.5;
  });

  setText(9, MUTED_ON_NAVY);
  doc.text(`${BRAND.consultant} \u00b7 ${BRAND.site}`, M, PAGE_H - 22);
  doc.link(M, PAGE_H - 27, 80, 8, { url: `https://${BRAND.site}` });
}

/* ------------------------------------------------------------ why it matters */

function whyPage() {
  page("Why this matters");
  let y = heading(WHY.eyebrow, WHY.title.length === 2 ? WHY.title : [WHY.title[0]], 30);

  y += 8;
  WHY.body.forEach((para, i) => {
    y = paragraph(para, M, y, COL_W, {
      size: 10.5,
      colour: i < 2 ? INK : MUTED,
      leading: 5.4,
    });
    y += 5;
  });

  // Findings on navy, because the brand keeps lilac off light backgrounds.
  y += 3;
  const boxW = (COL_W - 6) / 2;
  WHY.stats.forEach((finding, i) => {
    const x = M + (i % 2) * (boxW + 6);
    const top = y + Math.floor(i / 2) * 50;
    panel(x, top, boxW, 46, NAVY);
    setText(26, LILAC, { font: DISPLAY });
    doc.text(finding.stat, x + 6, top + 16);
    setText(11, CREAM, { font: SERIF });
    doc.text(finding.title, x + 6, top + 24);
    paragraph(finding.body, x + 6, top + 30, boxW - 12, {
      size: 7.8,
      colour: MUTED_ON_NAVY,
      leading: 3.7,
    });
  });

  rule(PAGE_H - 38);
  paragraph(WHY.sources, M, PAGE_H - 32, COL_W, { size: 7, colour: FAINT, leading: 3.4 });
}

/* -------------------------------------------------------------- the journey */

function mapPage() {
  page("The eight stages");
  let y = heading("The whole journey on one page", [
    "Eight steps, from the first",
    "search to the second booking",
  ], 26);

  y += 8;
  MAP_INTRO.forEach((para) => {
    y = paragraph(para, M, y, COL_W, { size: 10.5, colour: INK, leading: 5.4 });
    y += 5;
  });

  y += 6;
  STAGES.forEach((stage, i) => {
    const top = y + i * 20;
    const indent = M + i * 2.2;
    panel(indent, top, PAGE_W - M - indent, 16, i % 2 === 0 ? WARM_GREY : CREAM);

    fill(PURPLE);
    doc.circle(indent + 8, top + 8, 4.6, "F");
    setText(9, WHITE, { weight: "semibold" });
    doc.text(String(stage.n), indent + 8, top + 9.4, { align: "center" });

    setText(12, INK, { font: SERIF });
    doc.text(stage.title, indent + 17, top + 7.4);
    setText(8.5, MUTED);
    doc.text(stage.what, indent + 17, top + 12.6);
  });
}

/* --------------------------------------------------------------- the stages */

/** One stage, drawn as a half-page block. */
function stageBlock(stage, top) {
  const H = 122;
  panel(M, top, COL_W, H, CREAM);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.3);
  doc.rect(M, top, COL_W, H, "S");

  fill(PURPLE);
  doc.circle(M + 13, top + 14, 5.4, "F");
  setText(10.5, WHITE, { weight: "semibold" });
  doc.text(String(stage.n), M + 13, top + 15.6, { align: "center" });

  setText(17, INK, { font: DISPLAY });
  doc.text(stage.title, M + 23, top + 13);
  setText(9, MUTED);
  doc.text(stage.what, M + 23, top + 19.6);

  let y = paragraph(stage.why, M + 8, top + 29, COL_W - 16, {
    size: 9,
    colour: INK,
    leading: 4.3,
  });

  rule(y + 3, M + 8, COL_W - 16);

  const colW = (COL_W - 16 - 8) / 2;
  const colTop = y + 12;

  label("What goes wrong", M + 8, colTop, { size: 8 });
  let ly = colTop + 6.5;
  stage.wrong.forEach((line) => {
    ly = bullet(line, M + 8, ly, colW, RED, 8.4) + 2.6;
  });

  label("What to do", M + 8 + colW + 8, colTop, { size: 8 });
  let ry = colTop + 6.5;
  stage.fix.forEach((line) => {
    ry = bullet(line, M + 8 + colW + 8, ry, colW, GREEN, 8.4) + 2.6;
  });

  // The columns must clear the footer panel. If Inter ever runs longer than
  // this block allows, say so at build time rather than printing an overlap.
  const bottom = Math.max(ly, ry);
  const footTop = top + H - 23;
  if (bottom > footTop - 1) {
    throw new Error(
      `Stage ${stage.n} (${stage.title}) overflows its block by ${(bottom - footTop + 1).toFixed(1)}mm. Shorten a bullet or raise H.`,
    );
  }

  // The number to watch sits on navy, so it reads as the one thing to keep.
  const footY = top + H - 23;
  panel(M + 8, footY, COL_W - 16, 19, NAVY);
  setText(8, MUTED_ON_NAVY);
  doc.text("The number to watch", M + 12, footY + 6);
  setText(9.5, CREAM, { font: SERIF });
  doc.text(stage.kpi, M + 12, footY + 11.5);
  paragraph(`Where from: ${stage.from}`, M + 12, footY + 15.5, COL_W - 24, {
    size: 7.5,
    colour: MUTED_ON_NAVY,
    leading: 3.4,
  });
}

function stagePages() {
  for (let i = 0; i < STAGES.length; i += 2) {
    page(`Stages ${i + 1} and ${i + 2}`);
    stageBlock(STAGES[i], 26);
    stageBlock(STAGES[i + 1], 154);
  }
}

/* ----------------------------------------------------------------- the cost */

function costPage() {
  page("What the gaps cost");
  let y = heading("The bill nobody sends you", ["What the gaps cost,", "at your prices"], 30);

  y += 8;
  y = paragraph(
    "Nobody invoices you for a client who went elsewhere, which is why these gaps stay open for years. Here is what they add up to, with arithmetic kept simple enough that you can check it.",
    M,
    y,
    COL_W,
    { size: 10.5, colour: INK, leading: 5.4 },
  );

  y += 5;
  panel(M, y, COL_W, 14, WARM_GREY);
  setText(8.5, INK, { weight: "semibold" });
  doc.text(`Based on: ${COST.basis}`, M + 6, y + 6);
  setText(8.5, MUTED);
  doc.text(COST.scale, M + 6, y + 11);
  y += 22;

  const leakW = 62;
  const cellW = (COL_W - leakW) / COST.columns.length;

  setText(7.5, MUTED);
  COST.columns.forEach((col, i) => {
    doc.text(col.label, M + leakW + cellW * i + cellW - 3, y, { align: "right" });
  });
  y += 4;
  COST.columns.forEach((col, i) => {
    setText(6.5, FAINT);
    const lines = doc.splitTextToSize(col.example, cellW - 5);
    lines.slice(0, 2).forEach((line, li) => {
      doc.text(line, M + leakW + cellW * i + cellW - 3, y + li * 3, { align: "right" });
    });
  });
  y += 8;
  rule(y);
  y += 7;

  COST.rows.forEach((row) => {
    setText(11, INK, { font: SERIF });
    doc.text(row.leak, M, y);
    const assumptionEnd = paragraph(row.assumption, M, y + 4.5, leakW - 6, {
      size: 7.5,
      colour: MUTED,
      leading: 3.4,
    });
    setText(11, INK);
    COST.columns.forEach((col, i) => {
      doc.text(money(row.multiple * col.price), M + leakW + cellW * i + cellW - 3, y + 1, {
        align: "right",
      });
    });
    y = Math.max(assumptionEnd, y + 8) + 5;
    rule(y - 3.5);
  });

  y += 2;
  panel(M, y, COL_W, 17, NAVY);
  setText(8, MUTED_ON_NAVY);
  doc.text("Leaking every year", M + 6, y + 7);
  setText(6.5, MUTED_ON_NAVY);
  doc.text("If all five gaps are open", M + 6, y + 12);
  const total = COST.rows.reduce((sum, r) => sum + r.multiple, 0);
  COST.columns.forEach((col, i) => {
    setText(14, LILAC, { font: DISPLAY });
    doc.text(money(total * col.price), M + leakW + cellW * i + cellW - 3, y + 11, {
      align: "right",
    });
  });
  y += 24;

  y = paragraph(COST.note, M, y, COL_W, { size: 9, colour: MUTED, leading: 4.4 });

  const noteH = 32;
  y = Math.min(y + 10, PAGE_H - 24 - noteH);
  panel(M, y, COL_W, noteH, WARM_GREY);
  label("The part that stings", M + 7, y + 9, { size: 8 });
  paragraph(COST.close, M + 7, y + 15, COL_W - 14, { size: 9, colour: INK, leading: 4.4 });
}

/* ------------------------------------------------------------- first week */

function firstWeekPage() {
  page("Where to start");
  let y = heading("Your first week", ["Five things to do before", "you change anything big"], 28);

  y += 8;
  y = paragraph(FIRST_WEEK.intro, M, y, COL_W, { size: 10.5, colour: INK, leading: 5.4 });

  y += 8;
  FIRST_WEEK.steps.forEach((step) => {
    panel(M, y, COL_W, 28, WARM_GREY);
    fill(PURPLE);
    doc.rect(M, y, 1.6, 28, "F");
    setText(8, MUTED);
    doc.text(step.day, M + 7, y + 8);
    setText(14, INK, { font: SERIF });
    doc.text(step.title, M + 7, y + 16);
    paragraph(step.body, M + 7, y + 21.5, COL_W - 14, { size: 8.5, colour: MUTED, leading: 3.9 });
    y += 33;
  });

  y += 2;
  paragraph(FIRST_WEEK.close, M, y, COL_W, { size: 10.5, colour: INK, leading: 5.2, font: SERIF });
}

/* ------------------------------------------------------------------- next */

function nextPage() {
  page("Next step");
  let y = heading("Make it your numbers", NEXT.title, 28);

  y += 8;
  NEXT.body.forEach((para, i) => {
    y = paragraph(para, M, y, COL_W, { size: 10.5, colour: i === 2 ? INK : MUTED, leading: 5.4 });
    y += 5;
  });

  y += 4;
  panel(M, y, COL_W, 52, WARM_GREY);
  label("The free diagnostic gives you", M + 8, y + 10, { size: 8 });
  let by = y + 19;
  NEXT.bullets.forEach((line) => {
    by = bullet(line, M + 8, by, COL_W - 16, PURPLE, 9.5) + 3.5;
  });
  y += 60;

  // The call to action, on the gradient's darkest colour with a cream button.
  panel(M, y, COL_W, 34, NAVY);
  setText(16, CREAM, { font: DISPLAY });
  doc.text("Start your free diagnostic", PAGE_W / 2, y + 14, { align: "center" });
  const btnW = 76;
  const btnX = PAGE_W / 2 - btnW / 2;
  doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
  doc.roundedRect(btnX, y + 19, btnW, 10, 5, 5, "F");
  setText(9, NAVY, { weight: "semibold", charSpace: 0.3 });
  doc.text(BRAND.diagnosticUrl, PAGE_W / 2, y + 25.4, { align: "center" });
  doc.link(M, y, COL_W, 34, { url: `https://${BRAND.diagnosticUrl}` });
  y += 44;

  rule(y);
  y += 9;
  label("Who wrote this", M, y, { size: 8 });
  y = paragraph(NEXT.about, M, y + 7, COL_W, { size: 9.5, colour: MUTED, leading: 4.6 });
  y += 5;
  setText(10, INK, { font: SERIF });
  doc.text(`${BRAND.consultant} \u00b7 ${BRAND.company}`, M, y);
  setText(9, MUTED);
  doc.text(`${BRAND.email} \u00b7 ${BRAND.site}`, M, y + 5);
}

/* ------------------------------------------------------------- page numbers */

function paginate() {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    rule(PAGE_H - 16);
    setText(7.5, FAINT);
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

const out = process.argv[2] ?? "the-eight-stages-of-a-customer-journey.pdf";
writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log(`${out}  ${doc.getNumberOfPages()} pages`);
