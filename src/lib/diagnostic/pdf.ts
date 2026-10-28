import type { Answers, DiagnosticResult, Profile, SectionResult } from "./types";
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

  coverPage(doc, result, profile);
  whyItMattersPage(doc, profile);
  executiveSummary(doc, result, profile, answers);
  journeyMapPage(doc, result, profile);
  focusIntroPage(doc, result, profile);
  actionPlanPage(doc, result, profile);
  measurementPage(doc, result, profile);
  stageReviewIntroPage(doc, result, profile);
  result.sections.forEach((section, i) => sectionPage(doc, section, profile, i + 1));
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

function whyItMattersPage(doc: Doc, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Why this matters");
  const c = currencyFor(profile.currency).symbol;

  eyebrow(doc, "Before you spend more on ads", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("Fix the journey first. Then", M, 40);
  doc.text("the ads are worth paying for.", M, 49);

  let y = paragraph(
    doc,
    "Ads change one thing: how many people ask about you. What happens next decides how many of them become clients. If people are slipping away along the way, more ads just means more people slipping away. You pay twice - once for the ad, and again for the client you never got.",
    M,
    61,
    COL_W,
    { size: 10, colour: INK, leading: 5 },
  );

  y = paragraph(
    doc,
    "Here is what the research says about the eight stages in this report.",
    M,
    y + 4,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  // Four findings. Big number first, one short line under it.
  const findings = [
    {
      stat: "75%",
      title: "People choose fast",
      body:
        "of people pick a local business in under 30 minutes. More than one in four decide in under five. Most look at three businesses or fewer. Reply tomorrow and the job has gone.",
    },
    {
      stat: "71%",
      title: "Hard to book means no booking",
      body:
        "of regular clients say they have given up on booking because it was too hard to reach someone or book online. They did not complain. They just went elsewhere.",
    },
    {
      stat: "a third",
      title: "One text saves the slot",
      body:
        "fewer missed appointments after one text reminder the day before: 7.5% down to 5.0%. A no-show is a client you already paid for, in time you cannot sell twice.",
    },
    {
      stat: "97%",
      title: "Everyone checks you first",
      body:
        "of people read reviews before choosing a local business. More than two thirds will only use one rated 4 stars or better. Your reviews are read before your website.",
    },
  ];

  y += 6;
  const boxW = (COL_W - 6) / 2;
  findings.forEach((finding, i) => {
    const x = M + (i % 2) * (boxW + 6);
    const top = y + Math.floor(i / 2) * 50;

    doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
    doc.rect(x, top, boxW, 46, "F");
    setText(doc, 26, INK, { font: DISPLAY });
    doc.text(finding.stat, x + 5, top + 14);
    let titleSize = 8;
    setText(doc, titleSize, INK, "bold");
    while (doc.getTextWidth(finding.title) > boxW - 10 && titleSize > 6.5) {
      titleSize -= 0.25;
      setText(doc, titleSize, INK, "bold");
    }
    doc.text(finding.title, x + 5, top + 21);
    paragraph(doc, finding.body, x + 5, top + 27, boxW - 10, { size: 8, colour: MUTED, leading: 3.8 });
  });

  y += 50 * Math.ceil(findings.length / 2) + 2;

  // The arithmetic that makes the point better than any of the above.
  doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
  doc.rect(M, y, COL_W, 34, "F");
  setText(doc, 7.5, INK, "bold");
  doc.text("What this means for a marketing budget", M + 6, y + 8);
  paragraph(
    doc,
    `Say each enquiry costs you ${c}25, and one in five becomes a client. So ${c}1,000 buys 40 enquiries and 8 clients. Now make it one in three. The same ${c}1,000 buys 12 clients. To get those 4 extra clients from ads alone you would spend ${c}500 more, every month, for as long as you keep advertising. Fixing the journey is a one-off.`,
    M + 6,
    y + 15,
    COL_W - 12,
    { size: 9, colour: INK, leading: 4.4 },
  );
  y += 41;

  paragraph(
    doc,
    "The cheapest clients you will ever win are the ones already in your inbox.",
    M,
    y,
    COL_W,
    { size: 10, colour: INK, leading: 5 },
  );

  rule(doc, PAGE_H - 38);
  paragraph(
    doc,
    "Sources: Consumer Search Behavior, BrightLocal (2026), 1,200+ US consumers. Salon and Spa Consumer Survey, Zenoti (2025), 1,000+ US clients. Chong & Jawad, Reducing Did Not Attends at a Community Mental Health Service Through the Implementation of SMS Reminders: A Closed Loop Audit (2025). Local Consumer Review Survey, BrightLocal (2026), 1,002 US adults.",
    M,
    PAGE_H - 32,
    COL_W,
    { size: 7, colour: FAINT, leading: 3.4 },
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
    `Your strongest stage is ${strongest(result).title} at ${strongest(result).score}/100. The stage costing you most right now is ${result.priorities[0].title} at ${result.priorities[0].score}/100 - which is where this report starts.`,
    textX,
    y + 5,
    textW,
    { size: 10, colour: MUTED, leading: 5 },
  );
  // With a money estimate to show, this paragraph is the one to lose - the
  // figures below make the same point harder.
  const currency = currencyFor(profile.currency);
  if (!estimateImpact(answers, currency).available) {
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
  const impact = estimateImpact(answers, currency);
  if (impact.available) {
    const boxH = 15 + impact.leaks.length * 5;
    doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
    doc.rect(M, y, COL_W, boxH, "F");
    setText(doc, 7.5, INK, "bold");
    doc.text("What the gaps are costing you", M + 6, y + 8);
    setText(doc, 14, INK, "bold");
    doc.text(`${formatMoney(impact.recoverable, currency)} a year`, PAGE_W - M - 6, y + 9, {
      align: "right",
    });
    let ly = y + 14.5;
    impact.leaks.forEach((leak) => {
      setText(doc, 8.5, MUTED, "normal");
      doc.text(leak.label, M + 6, ly);
      setText(doc, 8.5, INK, "bold");
      doc.text(formatMoney(leak.annual, currency), PAGE_W - M - 6, ly, { align: "right" });
      ly += 5;
    });
    y += boxH + 8;
  }

  rule(doc, y);
  y += 10;
  eyebrow(doc, "Your top three priorities", M, y);
  y += 8;

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

function journeyMapPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Your journey map");

  eyebrow(doc, "Your customer journey map", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("Where clients flow - and where they leak", M, 40);
  paragraph(
    doc,
    "Each stage is colour-coded by how well it's working. A client has to pass through every one of these to become a returning, referring regular - so the weakest stage sets the ceiling for everything after it.",
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
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text(section.title, M, 40);

  setText(doc, 26, colour, { font: DISPLAY });
  doc.text(String(section.score), PAGE_W - M, 40, { align: "right" });
  setText(doc, 8, FAINT, "normal");
  doc.text("/100", PAGE_W - M, 45, { align: "right" });
  scoreBar(doc, M, 47, COL_W, section.score, colour);
  setText(doc, 8.5, colour, "bold");
  doc.text(STATUS_LABEL[section.status], M, 55);

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
    eyebrow(doc, "Recommendations", M, y, PURPLE);
    y += 6;
    section.fixes.slice(0, 3).forEach((fix, i) => {
      const boxTop = y - 4;
      const actionLines = doc.splitTextToSize(fix.action, COL_W - 12) as string[];
      const impactLines = doc.splitTextToSize(`Impact: ${fix.impact}`, COL_W - 12) as string[];
      const boxH = 10 + actionLines.length * 4.4 + impactLines.length * 4;
      doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
      doc.rect(M, boxTop, COL_W, boxH, "F");

      setText(doc, 7.5, INK, "bold");
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

  /*
    The foot of every stage page: the number to watch, where to find it, how
    often to look, the tools, and the thing worth building. Written out in
    full rather than abbreviated, which means it no longer always fits under
    the fixes - so it flows onto a second page when it has to.
  */
  doc.addPage();
  pageFurniture(doc, profile, section.title);

  eyebrow(doc, section.title, M, 30, FAINT);
  setText(doc, 22, INK, { font: DISPLAY });
  doc.text("How you'll know it's working", M, 41);

  let fy = 54;
  fy = paragraph(
    doc,
    `Track the following data: ${lowerFirst(section.measure.what)}`,
    M,
    fy,
    COL_W,
    { size: 11, colour: INK, leading: 5.2 },
  );

  fy += 10;
  rule(doc, fy - 4);
  setText(doc, 9, INK, "bold");
  doc.text("Where to get it", M, fy + 2);
  fy = paragraph(doc, section.measure.where, M, fy + 8, COL_W, {
    size: 10,
    colour: MUTED,
    leading: 4.9,
  });

  fy += 8;
  setText(doc, 9, INK, "bold");
  doc.text("How often to check", M, fy);
  fy = paragraph(doc, section.measure.cadence, M, fy + 6, COL_W, {
    size: 10,
    colour: MUTED,
    leading: 4.9,
  });

  fy += 14;
  rule(doc, fy - 6);
  eyebrow(doc, "Tools worth considering", M, fy, PURPLE);
  fy += 9;
  section.tools.forEach((tool) => {
    // The marker belongs beside the first line, so it is placed from the y the
    // paragraph started at, not the y it ended on.
    fillCircle(doc, M + 1.6, fy - 1.4, 1.1, PURPLE);
    fy = paragraph(doc, tool, M + 6, fy, COL_W - 6, {
      size: 10,
      colour: INK,
      leading: 4.9,
    });
    fy += 4;
  });

  fy += 8;
  const projectLines = (() => {
    setText(doc, 10.5, INK, "normal");
    return doc.splitTextToSize(section.project, COL_W - 14) as string[];
  })();
  const projectH = 28 + projectLines.length * 5;
  fillRect(doc, M, fy, COL_W, projectH, WARM_GREY);
  fillRect(doc, M, fy, 1.6, projectH, PURPLE);
  setText(doc, 7.5, INK, "bold");
  doc.text("WORTH CONSIDERING AS A PROJECT", M + 7, fy + 8, { charSpace: 0.6 });
  const pEnd = paragraph(doc, section.project, M + 7, fy + 15, COL_W - 14, {
    size: 10.5,
    colour: INK,
    leading: 5,
  });
  paragraph(
    doc,
    `If you'd like help setting it up, email ${DIAGNOSTIC.contactEmail}.`,
    M + 7,
    pEnd + 3,
    COL_W - 14,
    { size: 9.5, colour: MUTED, leading: 4.6 },
  );
}

/* "Every enquiry you receive..." reads wrong after a colon. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/*
  Before the plan itself: what a 90-day focus is, why this number and not one
  of the other seven, what moving it gets them, and which stages this quarter
  is deliberately leaving alone.
*/
function focusIntroPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Your 90-day focus");
  const cycle = result.cycle;

  eyebrow(doc, "What happens next", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("Your 90-day focus", M, 41);

  let y = paragraph(doc, cycle.explainer, M, 54, COL_W, {
    size: 10.5,
    colour: INK,
    leading: 5.2,
  });

  y += 10;
  doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
  const whyLines = (() => {
    setText(doc, 9.5, INK, "normal");
    return doc.splitTextToSize(cycle.chosenBecause, COL_W - 14) as string[];
  })();
  const whyH = 18 + whyLines.length * 4.6;
  doc.rect(M, y, COL_W, whyH, "F");
  fillRect(doc, M, y, 1.6, whyH, PURPLE);
  setText(doc, 7.5, INK, "bold");
  doc.text("WHY THIS NUMBER, AND NOT ONE OF THE OTHER SEVEN", M + 7, y + 8, { charSpace: 0.6 });
  paragraph(doc, cycle.chosenBecause, M + 7, y + 15, COL_W - 14, {
    size: 9.5,
    colour: INK,
    leading: 4.6,
  });
  y += whyH + 12;

  eyebrow(doc, "What you get when it moves", M, y, PURPLE);
  y = paragraph(doc, cycle.benefit, M, y + 8, COL_W, {
    size: 10,
    colour: INK,
    leading: 4.9,
  });

  if (cycle.later.length > 0) {
    y += 12;
    eyebrow(doc, "Not this quarter, but still a concern", M, y, FAINT);
    y = paragraph(
      doc,
      "These stages also scored below where they should be. They are deliberately not in the plan, because a quarter spent on everything is a quarter spent on nothing. Leave them until the number above has moved and held, then they become the next cycle.",
      M,
      y + 8,
      COL_W,
      { size: 9, colour: MUTED, leading: 4.3 },
    );
    y += 5;
    cycle.later.forEach((item) => {
      doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
      doc.rect(M, y, COL_W, 11, "F");
      fillRect(doc, M + 4, y + 4.4, 2.2, 2.2, statusColour(item.status));
      setText(doc, 9.5, INK, "bold");
      doc.text(item.stage, M + 9, y + 5);
      setText(doc, 8, MUTED, "normal");
      doc.text(item.kpi, M + 9, y + 9);
      setText(doc, 9.5, MUTED, "bold");
      doc.text(`${item.score}/100`, PAGE_W - M - 5, y + 7, { align: "right" });
      y += 13;
    });
  }
}

/* A divider, so the eight write-ups are not mistaken for the plan. */
function stageReviewIntroPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Stage-by-stage analysis");

  eyebrow(doc, "The detail", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("Stage-by-stage analysis", M, 41);

  let y = paragraph(
    doc,
    "The rest of this report is reference, not plan. All eight stages are written up over the following pages, whether they need work or not, so you can look any one of them up when you come to it.",
    M,
    54,
    COL_W,
    { size: 10.5, colour: INK, leading: 5.2 },
  );
  y = paragraph(
    doc,
    `What to actually do over the next three months is the 90-day focus you have just read: ${result.cycle.kpi}, and the priorities underneath it. If the two ever seem to disagree, follow the 90-day focus.`,
    M,
    y + 6,
    COL_W,
    { size: 10.5, colour: INK, leading: 5.2 },
  );

  y += 12;
  rule(doc, y);
  y += 10;
  eyebrow(doc, "How each stage is laid out", M, y, FAINT);
  y += 8;
  [
    "The score, and what it means in practice",
    "What is working, so you keep doing it",
    "What is leaking, named rather than hinted at",
    "What to do about it, in order",
    "The one number that tells you it is working, where to find it and how often to look",
    "Tools worth considering, and the thing worth building properly",
  ].forEach((line) => {
    y = bullet(doc, line, M, y, COL_W, PURPLE) + 2;
  });
}

function actionPlanPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "Your 90-day focus");
  const cycle = result.cycle;

  eyebrow(doc, "Your 90-day focus", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("One number, three or four priorities", M, 40);
  paragraph(
    doc,
    `Everything below moves ${cycle.kpi}. The windows add up to the whole thirteen weeks, so this is the quarter, not the first fortnight of it.`,
    M,
    50,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  // The KPI panel.
  let y = 64;
  const boxW = 46;
  const leftW = COL_W - boxW - 18;
  // Measure each block in the face it will actually be drawn in, or the
  // wrapping is wrong and the text runs out of its panel.
  setText(doc, 8.5, INK, "normal");
  const whyLines = doc.splitTextToSize(cycle.why, leftW) as string[];
  setText(doc, 9.5, INK, "bold");
  const targetLines = doc.splitTextToSize(cycle.target, boxW) as string[];
  const currentLines = doc.splitTextToSize(cycle.current ?? "Not measured", boxW) as string[];
  const panelH = Math.max(
    34 + whyLines.length * 4.3,
    26 + (currentLines.length + targetLines.length) * 4.3,
  );
  doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
  doc.rect(M, y, COL_W, panelH, "F");
  setText(doc, 7.5, INK, "bold");
  doc.text("Your focus KPI", M + 6, y + 8);
  setText(doc, 15, INK, "bold");
  doc.text(cycle.kpi, M + 6, y + 17);
  setText(doc, 8.5, MUTED, "normal");
  doc.text(cycle.metric, M + 6, y + 23);
  paragraph(doc, cycle.why, M + 6, y + 30, leftW, { size: 8.5, colour: INK, leading: 4.3 });

  // Today → target, in the right-hand column of the panel.
  const boxX = PAGE_W - M - boxW - 6;
  setText(doc, 7, FAINT, "bold");
  doc.text("Today", boxX, y + 8);
  setText(doc, 9.5, INK, "bold");
  doc.text(currentLines, boxX, y + 13);
  const targetY = y + 17 + currentLines.length * 4.3;
  setText(doc, 7, INK, "bold");
  doc.text("In 90 days", boxX, targetY);
  setText(doc, 9.5, INK, "bold");
  doc.text(targetLines, boxX, targetY + 5);
  y += panelH + 8;

  if (cycle.worth !== null) {
    setText(doc, 9, INK, "bold");
    doc.text(
      `Worth roughly ${formatMoney(cycle.worth, currencyFor(profile.currency))} a year once it moves.`,
      M,
      y,
    );
    y += 8;
  }

  // The aligned priorities.
  eyebrow(doc, "The priorities in this cycle", M, y, PURPLE);
  y += 8;
  cycle.priorities.forEach((priority, i) => {
    doc.setFillColor(PURPLE[0], PURPLE[1], PURPLE[2]);
    doc.circle(M + 3, y - 1.2, 3, "F");
    setText(doc, 8, WHITE, "bold");
    doc.text(String(i + 1), M + 3, y + 0.2, { align: "center" });

    setText(doc, 11, INK, "bold");
    doc.text(priority.title, M + 10, y);
    setText(doc, 8, FAINT, "bold");
    doc.text(priority.window, PAGE_W - M, y, { align: "right" });
    setText(doc, 8, INK, "normal");
    doc.text(`via ${priority.stage}`, M + 10, y + 4.6);
    y += 10;
    priority.steps.slice(0, i === 0 ? 3 : 2).forEach((step) => {
      y = bullet(doc, step, M + 10, y, COL_W - 10, PURPLE) + 2;
    });
    y += 4;
  });

  // Quick wins and the next cycle share the foot of the page.
  const footTop = Math.max(y + 2, 224);
  rule(doc, footTop - 6);
  eyebrow(doc, "Three things you can do this week", M, footTop, FAINT);
  let wy = footTop + 6;
  result.quickWins.slice(0, 3).forEach((win) => {
    wy = bullet(doc, win.action, M, wy, COL_W, PURPLE) + 1.5;
  });

  if (cycle.next) {
    const nextY = Math.max(wy + 4, 262);
    doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
    doc.rect(M, nextY, COL_W, 16, "F");
    setText(doc, 7.5, FAINT, "bold");
    doc.text("Then the next cycle", M + 5, nextY + 6);
    setText(doc, 9.5, INK, "bold");
    doc.text(`${cycle.next.kpi} - ${cycle.next.stage}`, M + 5, nextY + 12);
  }
}

/*
  Guidance is only useful if someone can tell whether it worked. This page names
  the numbers that follow from their own priorities, says where each one comes
  from, and gives them a scoreboard small enough that it might actually get kept.
*/
function measurementPage(doc: Doc, result: DiagnosticResult, profile: Profile) {
  doc.addPage();
  pageFurniture(doc, profile, "How to know it's working");

  eyebrow(doc, "Measuring the change", M, 30);
  setText(doc, 26, INK, { font: DISPLAY });
  doc.text("How you'll know it's working", M, 40);
  const metrics: { name: string; measure: SectionResult["measure"]; lead: boolean }[] = [
    { name: result.cycle.kpi, measure: result.cycle.measure, lead: true },
  ];
  result.cycle.priorities.slice(1).forEach((priority) => {
    const section = result.sections.find((s) => s.title === priority.stage);
    if (section && !metrics.some((m) => m.measure.what === section.measure.what)) {
      metrics.push({ name: priority.stage, measure: section.measure, lead: false });
    }
  });
  const shown = metrics.slice(0, 3);
  const counts = ["One number", "Two numbers", "Three numbers"];

  paragraph(
    doc,
    `${counts[shown.length - 1] ?? "These numbers"}, checked at the right interval, will tell you whether any of this landed. Everything else is noise until ${shown.length === 1 ? "it moves" : "they move"}.`,
    M,
    50,
    COL_W,
    { size: 10, colour: MUTED, leading: 5 },
  );

  let y = 64;
  shown.forEach((metric, i) => {
    const whatLines = doc.splitTextToSize(metric.measure.what, COL_W - 14) as string[];
    const whereLines = doc.splitTextToSize(`Where from: ${metric.measure.where}`, COL_W - 14) as string[];
    const cadenceLines = doc.splitTextToSize(`How often: ${metric.measure.cadence}`, COL_W - 14) as string[];
    const boxH = 24 + whatLines.length * 4.2 + (whereLines.length + cadenceLines.length) * 3.9;

    const tint = metric.lead ? WARM_GREY : WARM_GREY;
    doc.setFillColor(tint[0], tint[1], tint[2]);
    doc.rect(M, y, COL_W, boxH, "F");

    setText(doc, 7.5, metric.lead ? PURPLE : FAINT, "bold");
    doc.text(metric.lead ? "Your focus number" : `Supporting number ${i}`, M + 6, y + 8);
    setText(doc, 12.5, INK, "bold");
    doc.text(metric.name, M + 6, y + 15.5);

    let inner = paragraph(doc, metric.measure.what, M + 6, y + 22, COL_W - 14, {
      size: 9,
      colour: INK,
      leading: 4.2,
    });
    inner = paragraph(doc, `Where from: ${metric.measure.where}`, M + 6, inner + 1.5, COL_W - 14, {
      size: 8,
      colour: MUTED,
      leading: 3.9,
    });
    paragraph(doc, `How often: ${metric.measure.cadence}`, M + 6, inner + 1, COL_W - 14, {
      size: 8,
      colour: MUTED,
      leading: 3.9,
    });

    y += boxH + 5;
  });

  // A scoreboard small enough to rule on one page and keep by the till.
  y += 2;
  eyebrow(doc, "A scoreboard worth keeping", M, y, PURPLE);
  y = paragraph(
    doc,
    "Five numbers, written down every Monday for the week just gone. Two minutes, and it is the whole measurement system: a spreadsheet nobody fills in is worth less than a notebook that gets used.",
    M,
    y + 7,
    COL_W,
    { size: 9, colour: MUTED, leading: 4.3 },
  ) + 5;

  const columns = ["Week", "Enquiries", "Replied in 5 min", "Booked", "No-shows"];
  const colW = COL_W / columns.length;
  doc.setFillColor(WARM_GREY[0], WARM_GREY[1], WARM_GREY[2]);
  doc.rect(M, y, COL_W, 9, "F");
  columns.forEach((column, i) => {
    setText(doc, 7, MUTED, "bold");
    doc.text(column, M + 3 + i * colW, y + 6);
  });
  y += 9;
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.25);
  for (let row = 0; row < 4; row++) {
    const rowY = y + row * 7.5;
    doc.line(M, rowY + 7.5, M + COL_W, rowY + 7.5);
    doc.line(M, rowY, M, rowY + 7.5);
    doc.line(M + COL_W, rowY, M + COL_W, rowY + 7.5);
    columns.forEach((_, i) => {
      if (i > 0) doc.line(M + i * colW, rowY, M + i * colW, rowY + 7.5);
    });
  }
  y += 4 * 7.5 + 6;

  y = paragraph(
    doc,
    "Once a month, work out the two that need a month's distance: what share of enquiries became clients, and what share of your appointments were repeat clients.",
    M,
    y,
    COL_W,
    { size: 9, colour: MUTED, leading: 4.3 },
  );

  const noteY = Math.min(Math.max(y + 6, 244), 250);
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(M, noteY, COL_W, 24, "F");
  setText(doc, 10.5, WHITE, "bold");
  doc.text("If a number hasn't moved in six weeks", M + 8, noteY + 10);
  setText(doc, 9, [214, 206, 198], "normal");
  doc.text("Go back to the priority behind it rather than adding another one on top.", M + 8, noteY + 17.5);
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
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(M, y, COL_W, 34, "F");
  setText(doc, 13, WHITE, "bold");
  doc.text(`Book a ${DIAGNOSTIC.callMinutes}-minute call`, M + 8, y + 13);
  setText(doc, 9.5, [214, 206, 198], "normal");
  doc.text("We'll walk through your three priorities and what to fix first.", M + 8, y + 20);
  setText(doc, 9.5, [237, 198, 182], "bold");
  doc.text(DIAGNOSTIC.bookingUrl, M + 8, y + 27);

  y += 44;
  rule(doc, y);
  paragraph(
    doc,
    `Your score today is ${result.overall}/100, and your focus KPI is ${result.cycle.kpi}. Re-run this diagnostic in ninety days: when that number has moved and held, the next cycle takes on ${result.cycle.next ? result.cycle.next.kpi : "the next KPI"}.`,
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
  setText(doc, 10, MUTED, "normal");
  doc.text(DIAGNOSTIC.website, M, y + 7);
  doc.text(DIAGNOSTIC.bookingUrl, M, y + 14);

  doc.setFillColor(PURPLE[0], PURPLE[1], PURPLE[2]);
  doc.rect(M, PAGE_H - 40, 20, 1.4, "F");
  setText(doc, 8.5, FAINT, "normal");
  doc.text(
    "This report is confidential and prepared solely for the business named on the cover.",
    M,
    PAGE_H - 32,
  );
}
