/*
  Runs every test profile through the whole diagnostic and fails loudly if any
  invariant is broken.

    sh scripts/validate/validate.sh            # checks only
    sh scripts/validate/validate.sh --pdf      # also writes the six reports

  The report invariants live in src/lib/diagnostic/validate.ts so the same
  checks run wherever a report is built. This script adds the two that need a
  rendered document: that the pages agree with each other, and that nothing is
  drawn outside its margins.
*/

import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scoreDiagnostic } from "./lib/scoring.js";
import { estimateImpact, formatMoney } from "./lib/impact.js";
import { checkReport } from "./lib/validate.js";
import { frictionCeiling } from "./lib/scoring.js";
import { KPI_LIFT, ceilingFor } from "./lib/kpiLift.js";
import { TEST_PROFILES, answersFor } from "./lib/fixtures.js";
import { currencyFor } from "./lib/currency.js";
import { buildReport } from "./lib/pdf.js";

const WRITE_PDF = process.argv.includes("--pdf");
const OUT = "../public/samples";
const currency = currencyFor("GBP");

/* A4 in millimetres, and the band the page furniture occupies at each end. */
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
/* The running header's baseline and the footer's, which are page furniture and
   belong where they are. Body text has to stay between them. */
const HEADER_BASELINE = 14;
const FOOTER_BASELINE = 285;

/*
  jsPDF records every text run it draws, so the finished document can be asked
  where its ink actually landed rather than being eyeballed.

  The trap: a PDF content stream is always in points, whatever unit the
  document was created with. Reading those numbers as millimetres makes every
  page look like it is overflowing by half a metre.
*/
const PT_TO_MM = 25.4 / 72;

function checkLayout(doc) {
  const problems = [];
  const pages = doc.internal.pages;
  for (let page = 1; page < pages.length; page++) {
    const content = pages[page].join("\n");

    /*
      Two things can be read out of a page: where each line of text was placed,
      and where each filled box was drawn. A line that sits inside a box drawn
      after it is hidden behind that box, which is how a phase-three item
      disappeared under the "three things you can do this week" panel - the
      coordinates were all fine, and nothing was off the page.
    */
    const texts = [];
    for (const m of content.matchAll(
      /\/F\d+ ([\d.]+) Tf[\s\S]{0,120}?([\d.]+) ([\d.]+) Td\s*\(((?:\\.|[^)])*)\)\s*Tj/g,
    )) {
      const size = Number(m[1]) * PT_TO_MM;
      const label = m[4].replace(/\\(.)/g, "$1");
      texts.push({
        x: Number(m[2]) * PT_TO_MM,
        y: PAGE_H - Number(m[3]) * PT_TO_MM,
        // Rough, but a collision has to be wider than rough to matter.
        w: label.length * size * 0.52,
        label,
        at: m.index,
      });
    }
    // Anything the richer pattern missed still has to sit inside the page.
    for (const m of content.matchAll(/([\d.]+) ([\d.]+) Td/g)) {
      const x = Number(m[1]) * PT_TO_MM;
      const y = PAGE_H - Number(m[2]) * PT_TO_MM;
      if (!texts.some((t) => Math.abs(t.x - x) < 0.1 && Math.abs(t.y - y) < 0.1)) {
        texts.push({ x, y, w: 0, label: "", at: m.index });
      }
    }

    // Two runs sharing a baseline must not share any of it.
    for (let a = 0; a < texts.length; a++) {
      for (let b = a + 1; b < texts.length; b++) {
        const one = texts[a];
        const two = texts[b];
        if (one.w === 0 || two.w === 0) continue;
        if (Math.abs(one.y - two.y) > 1.5) continue;
        const left = one.x <= two.x ? one : two;
        const right = one.x <= two.x ? two : one;
        if (left.x + left.w > right.x + 0.5) {
          problems.push(
            `page ${page}: "${left.label.slice(0, 18)}" runs into "${right.label.slice(0, 18)}" at y=${left.y.toFixed(1)}mm`,
          );
        }
      }
    }

    const boxes = [];
    for (const m of content.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([-\d.]+) re\s*\n?f/g)) {
      /* jsPDF writes a rect as "x yTopFromBottom w -h re", so the stream's y
         is the box's TOP measured from the foot of the page, and the height
         runs downward from it. */
      const x = Number(m[1]) * PT_TO_MM;
      const top = PAGE_H - Number(m[2]) * PT_TO_MM;
      const w = Number(m[3]) * PT_TO_MM;
      const h = Math.abs(Number(m[4])) * PT_TO_MM;
      boxes.push({ x, w, top, bottom: top + h, at: m.index });
    }

    for (const t of texts) {
      if (page > 1 && (t.x < MARGIN - 2 || t.x > PAGE_W - MARGIN + 2)) {
        problems.push(`page ${page}: text starts at x=${t.x.toFixed(1)}mm, outside the ${MARGIN}mm margins`);
      }
      if (t.y > FOOTER_BASELINE + 1) {
        problems.push(`page ${page}: text at y=${t.y.toFixed(1)}mm is below the footer`);
      }
      if (page > 1 && t.y < HEADER_BASELINE - 1) {
        problems.push(`page ${page}: text at y=${t.y.toFixed(1)}mm is above the header`);
      }

      // Painted over by a box drawn later in the stream.
      for (const b of boxes) {
        if (b.at < t.at) continue;
        const inside =
          t.x >= b.x - 1 && t.x <= b.x + b.w + 1 && t.y >= b.top - 1 && t.y <= b.bottom + 1;
        if (inside) {
          problems.push(
            `page ${page}: text at y=${t.y.toFixed(1)}mm is hidden behind a box covering ${b.top.toFixed(1)}-${b.bottom.toFixed(1)}mm`,
          );
          break;
        }
      }
    }
  }
  return [...new Set(problems)];
}

/*
  The stream only knows where a line starts, not how far it runs, so a long
  line can still spill past the footer unnoticed. Rendering the page and
  looking for ink in the strip below the footer catches that. Skipped, with a
  note, where pdftoppm is not installed.
*/
function checkInkBelowFooter(path) {
  const probe = spawnSync("pdftoppm", ["-v"], { encoding: "utf8" });
  if (probe.error) return ["(skipped: pdftoppm not installed)"];

  const dir = mkdtempSync(join(tmpdir(), "cjd-"));
  spawnSync("pdftoppm", ["-r", "80", "-png", path, join(dir, "p")]);
  const problems = [];
  for (const file of readdirSync(dir)) {
    // The cover is a full-bleed gradient, so dark pixels there are the design.
    if (/-0*1\.png$/.test(file)) continue;
    // The bottom 6mm of an A4 page at 80dpi is the last ~19 rows.
    const out = spawnSync(
      "convert",
      [join(dir, file), "-crop", "0x19+0-0", "+repage", "-colorspace", "Gray",
       "-format", "%[fx:minima*255]", "info:-"],
      { encoding: "utf8" },
    );
    if (out.error) return ["(skipped: ImageMagick not installed)"];
    const darkest = Number(out.stdout);
    if (Number.isFinite(darkest) && darkest < 120) {
      problems.push(`${file}: ink below the footer`);
    }
  }
  rmSync(dir, { recursive: true, force: true });
  return problems;
}

/* The three places a priority stage is named have to agree. */
function checkAgreement(result) {
  const problems = [];
  const top = result.priorities.map((p) => p.title);
  const roadmap = result.priorities.filter((s) => s.status !== "green").slice(0, 3);
  const inDepth = (roadmap.length > 0 ? roadmap : result.priorities.slice(0, 2)).map((s) => s.title);

  inDepth.forEach((title) => {
    if (!top.includes(title)) {
      problems.push(`the roadmap covers ${title}, which is not one of the priorities`);
    }
  });

  const planStages = new Set(result.cycle.priorities.map((p) => p.stage));
  if (!planStages.has(result.cycle.stage)) {
    problems.push(`the week-by-week plan never mentions ${result.cycle.stage}, which the focus is built on`);
  }
  return problems;
}

const rows = [];
let failed = 0;

for (const profile of TEST_PROFILES) {
  const answers = answersFor(profile);
  const result = scoreDiagnostic(answers, currency);
  const impact = estimateImpact(answers, currency, result.overall, result.sections);

  const failures = checkReport(result, answers, currency);
  failures.push(...checkAgreement(result).map((detail) => ({ area: "agreement", detail })));

  if (result.overall < profile.expect.min || result.overall > profile.expect.max) {
    failures.push({
      area: "expectation",
      detail: `scored ${result.overall}, expected ${profile.expect.min}-${profile.expect.max}`,
    });
  }

  if (WRITE_PDF) {
    mkdirSync(OUT, { recursive: true });
    const doc = await buildReport(
      result,
      {
        name: "Test Profile",
        email: "test@example.com",
        business: profile.name,
        businessType: "Aesthetics clinic",
        currency: "GBP",
      },
      answers,
    );
    failures.push(...checkLayout(doc).map((detail) => ({ area: "layout", detail })));
    const path = `${OUT}/${profile.id}.pdf`;
    writeFileSync(path, Buffer.from(doc.output("arraybuffer")));
    checkInkBelowFooter(path).forEach((detail) => {
      if (detail.startsWith("(skipped")) console.log(`   layout ink check ${detail}`);
      else failures.push({ area: "layout", detail });
    });
  }

  rows.push({
    profile,
    result,
    impact,
    failures,
  });
  if (failures.length > 0) failed += 1;
}

/* ------------------------------------------------------------------ report */

const money = (n) => (n > 0 ? formatMoney(n, currency) : "-");

console.log("");
for (const row of rows) {
  const { profile, result, impact, failures } = row;
  const cost = impact.available
    ? `${money(impact.recoverable)} a year, on an estimated ${money(impact.annualRevenue)} revenue ` +
      `(${(impact.recoverable / impact.annualRevenue * 100).toFixed(1)}% of it)`
    : "no figure - appointment numbers not given";

  const priorities =
    result.priorities.length === 0
      ? "none qualify - Refine and protect"
      : result.priorities.map((p) => `${p.title} (${p.score}/100)`).join(", ");

  console.log(`${profile.name}  -  ${result.overall}/100  (${result.bandLabel})`);
  console.log(`   cost       ${cost}`);
  console.log(`   priorities ${priorities}`);
  console.log(`   focus      ${result.cycle.kpi}: ${result.cycle.current ?? "not measured"} -> ${result.cycle.target}`);
  console.log(`   next cycle ${result.cycle.next ? result.cycle.next.stage : "none named - re-run in 90 days to confirm your gains hold"}`);
  console.log(`   checks     ${failures.length === 0 ? "all passed" : `${failures.length} FAILED`}`);
  console.log("");
}

console.log("Rule-by-rule, across all profiles:");
const RULES = [
  ["no priority scores 80+", (r) => r.result.priorities.every((p) => p.score < 80)],
  ["every priority has a cost or scores under 75", (r) =>
    r.result.priorities.every((p) =>
      p.score < 75 ||
      (r.impact.available && (r.impact.leaks.find((l) => l.stageId === p.id)?.annual ?? 0) > 0))],
  ["next cycle is never one of this cycle's priorities", (r) =>
    !r.result.cycle.next ||
    !r.result.priorities.map((p) => p.title).includes(r.result.cycle.next.stage)],
  ["every stage under 50 carries a cost when numbers were given", (r) =>
    !r.impact.available ||
    r.result.sections
      .filter((s) => s.score < 50)
      .every((s) => (r.impact.leaks.find((l) => l.stageId === s.id)?.annual ?? 0) > 0)],
  ["the total stays under 15% of revenue", (r) =>
    !r.impact.available || r.impact.recoverable <= r.impact.annualRevenue * 0.15 + 1],
  ["the parts add up to the total", (r) =>
    !r.impact.available ||
    Math.abs(r.impact.leaks.reduce((t, l) => t + l.annual, 0) - r.impact.recoverable) <= 1],
  ["no stage scores above what its named problems allow", (r) =>
    r.result.sections.every((s) => s.score <= frictionCeiling(s.gaps.length))],
  ["the focus target carries a unit", (r) =>
    /[%£$€]|\d\s*[a-z+]|minute|hour|day|week|month|review|client|enquir|out of/i.test(r.result.cycle.target)],
  ["nothing is drawn outside its margins or hidden behind a box", (r) =>
    !r.failures.some((f) => f.area === "layout")],
  ["no focus target exceeds the maximum lift for its KPI", (r) => {
    const today = /(\d+(?:\.\d+)?)/.exec(r.result.cycle.current ?? "");
    const target = /(\d+(?:\.\d+)?)/.exec(r.result.cycle.target);
    if (!today || !target) return true;
    const ceiling = ceilingFor(r.result.cycle.kpi, Number(today[1]));
    if (ceiling === null) return true;
    return KPI_LIFT[r.result.cycle.kpi]?.direction === "down"
      ? Number(target[1]) >= ceiling - 0.5
      : Number(target[1]) <= ceiling + 0.5;
  }],
  ["the next cycle never names a stage scoring 80+", (r) => {
    if (!r.result.cycle.next) return true;
    const named = r.result.sections.find((s) => s.title === r.result.cycle.next.stage);
    return !named || named.score < 80;
  }],
  ["no stage scores above what its friction allows", (r) =>
    r.result.sections.every((s) => s.score <= frictionCeiling(s.friction))],
  ["no cost line is labelled by its stage name", (r) =>
    r.impact.leaks.every((l) => !/: what the gap costs$/.test(l.label))],
];
for (const [name, holds] of RULES) {
  const broken = rows.filter((r) => !holds(r)).map((r) => r.profile.name);
  console.log(`   ${broken.length === 0 ? "pass" : "FAIL"}  ${name}` +
    (broken.length ? `  (${broken.join(", ")})` : ""));
}
console.log("");

for (const row of rows) {
  if (row.failures.length === 0) continue;
  console.log(`${row.profile.name}:`);
  for (const f of row.failures) console.log(`   [${f.area}] ${f.detail}`);
  console.log("");
}

if (failed > 0) {
  console.error(`${failed} of ${rows.length} profiles failed.`);
  process.exit(1);
}
console.log(`All ${rows.length} profiles passed every check.`);
