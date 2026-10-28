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
    for (const m of content.matchAll(/([\d.]+) ([\d.]+) Td/g)) {
      const x = Number(m[1]) * PT_TO_MM;
      // The stream's origin is the bottom-left corner of the page.
      const y = PAGE_H - Number(m[2]) * PT_TO_MM;

      // The cover bleeds to the edges on purpose; every other page does not.
      if (page > 1 && (x < MARGIN - 2 || x > PAGE_W - MARGIN + 2)) {
        problems.push(`page ${page}: text starts at x=${x.toFixed(1)}mm, outside the ${MARGIN}mm margins`);
      }
      if (y > FOOTER_BASELINE + 1) {
        problems.push(`page ${page}: text at y=${y.toFixed(1)}mm is below the footer`);
      }
      if (page > 1 && y < HEADER_BASELINE - 1) {
        problems.push(`page ${page}: text at y=${y.toFixed(1)}mm is above the header`);
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
  const impact = estimateImpact(answers, currency, result.overall);

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
const pad = (s, n) => String(s).padEnd(n);

console.log("");
console.log(pad("Profile", 24) + pad("Score", 7) + pad("Top three priorities", 58) + pad("A year", 10) + "Checks");
console.log("-".repeat(108));
for (const row of rows) {
  const top = row.result.priorities.map((p) => p.shortTitle).join(", ");
  console.log(
    pad(row.profile.name, 24) +
      pad(`${row.result.overall}/100`, 7) +
      pad(top.slice(0, 56), 58) +
      pad(money(row.impact.available ? row.impact.recoverable : 0), 10) +
      (row.failures.length === 0 ? "pass" : `${row.failures.length} FAILED`),
  );
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
