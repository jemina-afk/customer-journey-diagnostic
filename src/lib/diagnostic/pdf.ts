import type { DiagnosticResult, Profile, SectionResult } from "./types";
import { DIAGNOSTIC } from "./config";
import { STATUS_LABEL } from "./scoring";

/*
  The consulting deliverable. Drawn as vectors with jsPDF rather than a screen
  capture, so type stays sharp at any zoom and the file stays small enough to
  email. Loaded on demand — jsPDF never enters the initial bundle.
*/

const INK: RGB = [32, 27, 24];
const MUTED: RGB = [106, 96, 88];
const FAINT: RGB = [154, 143, 134];
const LINE: RGB = [226, 217, 206];
const CLAY: RGB = [190, 96, 68];
const CLAY_SOFT: RGB = [246, 232, 225];
const GOLD: RGB = [173, 138, 79];
const CANVAS: RGB = [250, 247, 243];
const VEIL: RGB = [244, 239, 232];
const GREEN: RGB = [62, 122, 96];
const AMBER: RGB = [191, 141, 51];
const RED: RGB = [178, 66, 51];
const WHITE: RGB = [255, 255, 255];

type RGB = [number, number, number];
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
  if (score >= 60) return GOLD;
  if (score >= 40) return AMBER;
  return RED;
}

export async function buildReport(result: DiagnosticResult, profile: Profile): Promise<Doc> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setLineJoin("round");
  doc.setLineCap("round");

  coverPage(doc, result, profile);
  executiveSummary(doc, result, profile);
  journeyMapPage(doc, result, profile);
  result.sections.forEach((section, i) => sectionPage(doc, section, profile, i + 1));
  actionPlanPage(doc, result, profile);
  nextStepsPage(doc, result, profile);
  aboutPage(doc, profile);

  paginate(doc);
  return doc;
}

export async function downloadReport(result: DiagnosticResult, profile: Profile): Promise<void> {
  const doc = await buildReport(result, profile);
  doc.save(fileName(profile));
}

export async function reportDataUri(result: DiagnosticResult, profile: Profile): Promise<string> {
  const doc = await buildReport(result, profile);
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

function setText(doc: Doc, size: number, colour: RGB, weight: "normal" | "bold" = "normal") {
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  doc.setTextColor(colour[0], colour[1], colour[2]);
}

/** Draws wrapped text and returns the y position just below it. */
function paragraph(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  width: number,
  opts: { size?: number; colour?: RGB; weight?: "normal" | "bold"; leading?: number } = {},
): number {
  const size = opts.size ?? 10;
  const leading = opts.leading ?? size * 0.52;
  setText(doc, size, opts.colour ?? MUTED, opts.weight ?? "normal");
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line, i) => doc.text(line, x, y + i * leading));
  return y + lines.length * leading;
}

function eyebrow(doc: Doc, text: string, x: number, y: number, colour: RGB = CLAY) {
  setText(doc, 7.5, colour, "bold");
  doc.text(text.toUpperCase(), x, y, { charSpace: 0.9 });
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
  doc.setFillColor(CANVAS[0], CANVAS[1], CANVAS[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  setText(doc, 7.5, FAINT, "bold");
  doc.text(label.toUpperCase(), M, 14, { charSpace: 0.8 });
  doc.text(profile.business.toUpperCase(), PAGE_W - M, 14, { align: "right", charSpace: 0.8 });
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
function dial(doc: Doc, cx: number, cy: number, radius: number, score: number) {
  const colour = bandColour(score);
  doc.setLineWidth(3.4);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.circle(cx, cy, radius, "S");

  const segments = Math.max(1, Math.round((score / 100) * 72));
  doc.setDrawColor(colour[0], colour[1], colour[2]);
  for (let i = 0; i < segments; i++) {
    const a0 = -Math.PI / 2 + (i / 72) * Math.PI * 2;
    const a1 = -Math.PI / 2 + ((i + 1) / 72) * Math.PI * 2;
    doc.line(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius);
  }

  const big = radius >= 18;
  setText(doc, big ? 26 : 20, INK, "bold");
  doc.text(String(score), cx, cy + (big ? 1 : 2.4), { align: "center" });
  if (big) {
    setText(doc, 7, FAINT, "normal");
    doc.text("OUT OF 100", cx, cy + 7.5, { align: "center", charSpace: 0.6 });
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
  doc.setFillColor(CLAY[0], CLAY[1], CLAY[2]);
  doc.setDrawColor(CLAY[0], CLAY[1], CLAY[2]);
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
  doc.roundedRect(x, y, width, 2.2, 1.1, 1.1, "F");
  doc.setFillColor(colour[0], colour[1], colour[2]);
  const w = Math.max((width * score) / 100, 2.2);
  doc.roundedRect(x, y, w, 2.2, 1.1, 1.1, "F");
}

/* ------------------------------------------------------------------ pages */

function coverPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.setFillColor(CANVAS[0], CANVAS[1], CANVAS[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  doc.setFillColor(CLAY_SOFT[0], CLAY_SOFT[1], CLAY_SOFT[2]);
  doc.rect(0, 0, PAGE_W, 6, "F");
  doc.setFillColor(CLAY[0], CLAY[1], CLAY[2]);
  doc.rect(0, 0, 62, 6, "F");

  // Wordmark
  doc.setFillColor(CLAY[0], CLAY[1], CLAY[2]);
  doc.rect(M, 32, 2.4, 2.4, "F");
  setText(doc, 8.5, MUTED, "bold");
  doc.text("TULIVO DIGITAL", M + 5.5, 34.2, { charSpace: 1.6 });

  setText(doc, 34, INK, "bold");
  doc.text("Customer Journey", M, 96);
  doc.text("Diagnostic Report", M, 110);

  setText(doc, 11, MUTED, "normal");
  doc.text("A stage-by-stage review of how your business turns", M, 126);
  doc.text("attention into booked, returning clients.", M, 132);

  // Score block
  doc.setFillColor(VEIL[0], VEIL[1], VEIL[2]);
  doc.roundedRect(M, 150, COL_W, 46, 4, 4, "F");
  dial(doc, M + 30, 173, 16, result.overall);
  eyebrow(doc, "Overall score", M + 58, 165);
  setText(doc, 16, INK, "bold");
  doc.text(result.bandLabel, M + 58, 174);
  paragraph(doc, result.bandSummary, M + 58, 180, COL_W - 68, { size: 8.5, colour: MUTED, leading: 4 });

  rule(doc, 214);
  eyebrow(doc, "Prepared for", M, 224, FAINT);
  setText(doc, 14, INK, "bold");
  doc.text(profile.name, M, 232);
  setText(doc, 10.5, MUTED, "normal");
  doc.text(`${profile.business} · ${profile.businessType}`, M, 239);

  eyebrow(doc, "Prepared by", PAGE_W / 2 + 10, 224, FAINT);
  setText(doc, 14, INK, "bold");
  doc.text(DIAGNOSTIC.consultant, PAGE_W / 2 + 10, 232);
  setText(doc, 10.5, MUTED, "normal");
  doc.text(DIAGNOSTIC.company, PAGE_W / 2 + 10, 239);

  rule(doc, 250);
  setText(doc, 9, FAINT, "normal");
  doc.text(
    new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    M,
    258,
  );
  doc.text(DIAGNOSTIC.contactEmail, PAGE_W - M, 258, { align: "right" });
}

function executiveSummary(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Executive summary");

  eyebrow(doc, "Executive summary", M, 30);
  setText(doc, 21, INK, "bold");
  doc.text("What your answers show", M, 40);

  dial(doc, M + 26, 70, 20, result.overall);
  setText(doc, 11, bandColour(result.overall), "bold");
  doc.text(result.bandLabel.toUpperCase(), M + 26, 98, { align: "center", charSpace: 1.2 });

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
    `Your strongest stage is ${strongest(result).title} at ${strongest(result).score}/100. The stage costing you most right now is ${result.priorities[0].title} at ${result.priorities[0].score}/100 — which is where this report starts.`,
    textX,
    y + 5,
    textW,
    { size: 10, colour: MUTED, leading: 5 },
  );
  y = paragraph(
    doc,
    "Every finding is drawn from what you told us. Nothing here is generic: the gaps are the ones your answers revealed, and the recommendations are ordered by what a fix is worth to you.",
    textX,
    y + 5,
    textW,
    { size: 10, colour: MUTED, leading: 5 },
  );

  y = Math.max(y, 108) + 10;
  rule(doc, y);
  y += 10;
  eyebrow(doc, "Your top three priorities", M, y);
  y += 8;

  result.priorities.forEach((section, i) => {
    const colour = statusColour(section.status);
    const summary = section.gaps[0] ?? section.verdict;
    const lines = doc.splitTextToSize(summary, COL_W - 16) as string[];
    const boxH = 20 + lines.length * 4.2;

    doc.setFillColor(VEIL[0], VEIL[1], VEIL[2]);
    doc.roundedRect(M, y, COL_W, boxH, 3, 3, "F");
    doc.setFillColor(colour[0], colour[1], colour[2]);
    doc.roundedRect(M, y, 1.6, boxH, 0.8, 0.8, "F");

    setText(doc, 7.5, CLAY, "bold");
    doc.text(`#${i + 1} PRIORITY`, M + 7, y + 8, { charSpace: 0.8 });
    setText(doc, 12.5, INK, "bold");
    doc.text(section.title, M + 7, y + 15);
    setText(doc, 9, colour, "bold");
    doc.text(`${section.score}/100 · ${STATUS_LABEL[section.status]}`, PAGE_W - M - 7, y + 15, { align: "right" });
    paragraph(doc, summary, M + 7, y + 21, COL_W - 16, { size: 8.5, colour: MUTED, leading: 4.2 });
    y += boxH + 5;
  });

  y += 4;
  rule(doc, y);
  paragraph(
    doc,
    `The next page maps all eight stages of your journey. From there, each stage has a page of its own: what's working, what's missing, and exactly what to do about it — followed by your prioritised ${result.plan.length > 1 ? "30/60/90 day " : ""}action plan.`,
    M,
    y + 9,
    COL_W,
    { size: 9.5, colour: MUTED, leading: 4.6 },
  );
}

function strongest(result: DiagnosticResult): SectionResult {
  return [...result.sections].sort((a, b) => b.score - a.score)[0];
}

function journeyMapPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Your journey map");

  eyebrow(doc, "Your customer journey map", M, 30);
  setText(doc, 21, INK, "bold");
  doc.text("Where clients flow — and where they leak", M, 40);
  paragraph(
    doc,
    "Each stage is colour-coded by how well it's working. A client has to pass through every one of these to become a returning, referring regular — so the weakest stage sets the ceiling for everything after it.",
    M,
    50,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  radar(doc, PAGE_W / 2, 108, 32, result.sections);

  let y = 158;
  eyebrow(doc, "Stage by stage", M, y);
  y += 8;
  result.sections.forEach((section, i) => {
    const colour = statusColour(section.status);
    doc.setFillColor(colour[0], colour[1], colour[2]);
    doc.circle(M + 3, y - 1, 3, "F");
    setText(doc, 8, WHITE, "bold");
    doc.text(String(i + 1), M + 3, y + 0.3, { align: "center" });

    setText(doc, 10, INK, "bold");
    doc.text(section.title, M + 10, y);
    setText(doc, 9, colour, "bold");
    doc.text(`${section.score}/100 · ${STATUS_LABEL[section.status]}`, PAGE_W - M, y, { align: "right" });

    if (i < result.sections.length - 1) {
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.setLineWidth(0.4);
      doc.line(M + 3, y + 2.6, M + 3, y + 8.4);
    }
    y += 12;
  });
}

function sectionPage(doc: Doc, section: SectionResult, profile: Profile, index: number) {
  doc.addPage();
  pageFurniture(doc, profile, `Stage ${index} of 8`);
  const colour = statusColour(section.status);

  eyebrow(doc, `Stage ${index}`, M, 30);
  setText(doc, 21, INK, "bold");
  doc.text(section.title, M, 40);

  setText(doc, 22, colour, "bold");
  doc.text(String(section.score), PAGE_W - M, 40, { align: "right" });
  setText(doc, 8, FAINT, "normal");
  doc.text("/100", PAGE_W - M, 45, { align: "right" });
  scoreBar(doc, M, 47, COL_W, section.score, colour);
  setText(doc, 8.5, colour, "bold");
  doc.text(STATUS_LABEL[section.status].toUpperCase(), M, 55, { charSpace: 0.8 });

  let y = paragraph(doc, section.verdict, M, 65, COL_W, { size: 10, colour: INK, leading: 5 });
  y += 8;

  if (section.strengths.length > 0) {
    eyebrow(doc, "What's working", M, y, GREEN);
    y += 6;
    section.strengths.slice(0, 3).forEach((s) => {
      y = bullet(doc, s, M, y, COL_W, GREEN) + 2.5;
    });
    y += 4;
  }

  if (section.gaps.length > 0) {
    eyebrow(doc, "Gaps identified", M, y, RED);
    y += 6;
    section.gaps.slice(0, 3).forEach((g) => {
      y = bullet(doc, g, M, y, COL_W, RED) + 2.5;
    });
    y += 4;
  }

  if (section.fixes.length > 0) {
    eyebrow(doc, "Recommendations", M, y, CLAY);
    y += 6;
    section.fixes.slice(0, 3).forEach((fix, i) => {
      const boxTop = y - 4;
      const actionLines = doc.splitTextToSize(fix.action, COL_W - 12) as string[];
      const impactLines = doc.splitTextToSize(`Impact: ${fix.impact}`, COL_W - 12) as string[];
      const boxH = 10 + actionLines.length * 4.4 + impactLines.length * 4;
      doc.setFillColor(VEIL[0], VEIL[1], VEIL[2]);
      doc.roundedRect(M, boxTop, COL_W, boxH, 2.5, 2.5, "F");

      setText(doc, 7.5, CLAY, "bold");
      doc.text(`${String(i + 1).padStart(2, "0")} · ${fix.effort === "quick" ? "QUICK WIN" : "PROJECT"}`, M + 5, boxTop + 6, {
        charSpace: 0.6,
      });
      let inner = paragraph(doc, fix.action, M + 5, boxTop + 12, COL_W - 12, {
        size: 9.5,
        colour: INK,
        leading: 4.4,
      });
      paragraph(doc, `Impact: ${fix.impact}`, M + 5, inner + 1, COL_W - 12, {
        size: 8.5,
        colour: MUTED,
        leading: 4,
      });
      y = boxTop + boxH + 5;
    });
  } else {
    y = paragraph(
      doc,
      "No urgent gaps here. Keep this stage running as it is and revisit it when the priorities above are done.",
      M,
      y,
      COL_W,
      { size: 9.5, colour: MUTED, leading: 4.4 },
    ) + 6;
  }

  // Tools sit at the foot of the page so every stage page ends the same way.
  const toolsY = Math.max(y + 4, 248);
  rule(doc, toolsY - 6);
  eyebrow(doc, "Tools worth considering", M, toolsY, FAINT);
  let ty = toolsY + 5;
  section.tools.slice(0, 3).forEach((tool) => {
    ty = paragraph(doc, `· ${tool}`, M, ty, COL_W, { size: 8.5, colour: MUTED, leading: 4 }) + 0.5;
  });
}

function actionPlanPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Prioritised action plan");

  eyebrow(doc, "Your action plan", M, 30);
  setText(doc, 21, INK, "bold");
  doc.text("What to do, in what order", M, 40);
  paragraph(
    doc,
    "Work top to bottom. The quick wins take under an hour each and start returning immediately; the 30/60/90 plan builds the systems that keep the gains.",
    M,
    50,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  let y = 66;
  eyebrow(doc, "Three things you can do this week", M, y, CLAY);
  y += 7;
  result.quickWins.forEach((win, i) => {
    const lines = doc.splitTextToSize(win.action, COL_W - 32) as string[];
    const boxH = 8 + lines.length * 4.3;
    doc.setFillColor(CLAY_SOFT[0], CLAY_SOFT[1], CLAY_SOFT[2]);
    doc.roundedRect(M, y - 4, COL_W, boxH, 2.5, 2.5, "F");
    setText(doc, 7.5, CLAY, "bold");
    doc.text(`WIN ${i + 1}`, M + 5, y + 1.5, { charSpace: 0.6 });
    paragraph(doc, win.action, M + 22, y + 1.5, COL_W - 32, { size: 9.5, colour: INK, leading: 4.3 });
    y += boxH + 2.5;
  });

  y += 5;
  // Later phases are trimmed to their two headline moves so the whole plan
  // stays on one page whatever the answers were.
  const phases = result.plan.filter((p) => p.horizon !== "Ongoing");
  phases.forEach((phase, phaseIndex) => {
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.rect(M, y - 3.4, 1.4, 4.6, "F");
    setText(doc, 11.5, INK, "bold");
    doc.text(phase.horizon, M + 5, y);
    setText(doc, 8.5, CLAY, "normal");
    doc.text(phase.focus, M + 5, y + 4.6);
    y += 10;
    phase.steps.slice(0, phaseIndex === 0 ? 3 : 2).forEach((step) => {
      y = bullet(doc, step, M + 5, y, COL_W - 5, GOLD) + 2;
    });
    y += 4.5;
  });

  const ongoing = result.plan.find((p) => p.horizon === "Ongoing");
  if (ongoing) {
    const top = Math.max(y + 2, 230);
    rule(doc, top - 6);
    eyebrow(doc, "Then, ongoing", M, top, FAINT);
    let oy = top + 6;
    ongoing.steps.forEach((step) => {
      oy = bullet(doc, step, M, oy, COL_W, FAINT) + 2;
    });
  }
}

function nextStepsPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Next steps");

  eyebrow(doc, "Next steps", M, 30);
  setText(doc, 21, INK, "bold");
  doc.text("Three ways to close these gaps", M, 40);
  paragraph(
    doc,
    `Your report is written so you can act on it alone. If you'd rather it was built with you — or simply done faster — here's how that works.`,
    M,
    50,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  let y = 70;
  DIAGNOSTIC.offers.forEach((offer, i) => {
    const lines = doc.splitTextToSize(offer.description, COL_W - 14) as string[];
    const boxH = 20 + lines.length * 4.4;
    doc.setFillColor(i === 1 ? CLAY_SOFT[0] : VEIL[0], i === 1 ? CLAY_SOFT[1] : VEIL[1], i === 1 ? CLAY_SOFT[2] : VEIL[2]);
    doc.roundedRect(M, y, COL_W, boxH, 3, 3, "F");
    setText(doc, 8, CLAY, "bold");
    doc.text(`OPTION ${i + 1}`, M + 6, y + 8, { charSpace: 0.8 });
    setText(doc, 13, INK, "bold");
    doc.text(offer.name, M + 6, y + 15);
    setText(doc, 11, CLAY, "bold");
    doc.text(offer.price, PAGE_W - M - 6, y + 15, { align: "right" });
    paragraph(doc, offer.description, M + 6, y + 21, COL_W - 14, { size: 9, colour: MUTED, leading: 4.4 });
    y += boxH + 6;
  });

  y += 4;
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.roundedRect(M, y, COL_W, 34, 3, 3, "F");
  setText(doc, 13, WHITE, "bold");
  doc.text("Book a 15-minute call", M + 8, y + 13);
  setText(doc, 9.5, [214, 206, 198], "normal");
  doc.text("We'll walk through your three priorities and what to fix first.", M + 8, y + 20);
  setText(doc, 9.5, [237, 198, 182], "bold");
  doc.text(DIAGNOSTIC.bookingUrl, M + 8, y + 27);

  y += 44;
  rule(doc, y);
  paragraph(
    doc,
    `Your score today is ${result.overall}/100. Re-run this diagnostic in 90 days to see exactly how far the changes have moved it.`,
    M,
    y + 8,
    COL_W,
    { size: 9.5, colour: MUTED, leading: 4.4 },
  );
}

function aboutPage(doc: Doc, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "About");

  eyebrow(doc, "About", M, 30);
  setText(doc, 21, INK, "bold");
  doc.text(DIAGNOSTIC.company, M, 40);

  let y = paragraph(
    doc,
    `${DIAGNOSTIC.consultant} helps wellness and beauty business owners fix the journey between "I'm interested" and "I've rebooked". Most businesses in this sector don't have a marketing problem — they have a journey problem: enquiries that go unanswered, follow-ups that never happen, and clients who simply drift away.`,
    M,
    54,
    COL_W,
    { size: 10.5, colour: INK, leading: 5.2 },
  );

  y = paragraph(
    doc,
    "The work is practical: response systems, booking that doesn't lose people, reminders that protect your diary, review engines and retention sequences — built into the business, not handed over as a document.",
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
    "Automation and CRM builds for clinics, studios and salons",
    "Websites and booking journeys designed to convert",
    "Reputation, retention and referral systems",
  ].forEach((line) => {
    y = bullet(doc, line, M, y, COL_W, CLAY) + 2.5;
  });

  y += 10;
  rule(doc, y);
  y += 10;
  eyebrow(doc, "Get in touch", M, y, FAINT);
  y += 8;
  setText(doc, 11, INK, "bold");
  doc.text(DIAGNOSTIC.contactEmail, M, y);
  setText(doc, 10, MUTED, "normal");
  doc.text(DIAGNOSTIC.website, M, y + 7);
  doc.text(DIAGNOSTIC.bookingUrl, M, y + 14);

  doc.setFillColor(CLAY[0], CLAY[1], CLAY[2]);
  doc.rect(M, PAGE_H - 40, 20, 1.4, "F");
  setText(doc, 8.5, FAINT, "normal");
  doc.text(
    "This report is confidential and prepared solely for the business named on the cover.",
    M,
    PAGE_H - 32,
  );
}
