/*
  Renders the signature gradient to an image, so documents and the website show
  the same artwork.

    node scripts/lib/build-gradient.mjs

  Painted by the browser from the same CSS as .tulivo-gradient in
  brand/tokens.css, including the grain, then saved as a JPEG at print
  resolution. Doing it this way keeps the PDFs small and smooth: drawing the
  gradient as vector bands cost a megabyte and still showed banding.
*/

import { writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const EXE = process.env.CHROME ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
const W = 1240; // A4 at 150dpi
const H = 1754;

const HTML = `<!doctype html><html><head><style>
  html, body { margin: 0; padding: 0; }
  .g {
    width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
    background:
      radial-gradient(40% 50% at 20% 30%, rgba(122, 63, 120, 0.55) 0%, transparent 70%),
      radial-gradient(35% 45% at 75% 25%, rgba(91, 58, 140, 0.5) 0%, transparent 70%),
      radial-gradient(30% 40% at 60% 80%, rgba(122, 63, 120, 0.45) 0%, transparent 70%),
      radial-gradient(18% 22% at 30% 85%, rgba(203, 182, 232, 0.28) 0%, transparent 70%),
      #1B2138;
  }
  .g::after {
    content: ""; position: absolute; inset: 0; opacity: 0.22; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
</style></head><body><div class="g"></div></body></html>`;

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(HTML);
await page.waitForTimeout(400);
const buf = await page.locator(".g").screenshot({ type: "jpeg", quality: 88 });
await browser.close();

writeFileSync(
  "scripts/lib/brand-gradient.mjs",
  `/*\n  The signature gradient as a print-resolution JPEG, rendered by\n` +
    `  scripts/lib/build-gradient.mjs from the same CSS as brand/tokens.css.\n` +
    `  Do not edit by hand.\n*/\n\nexport const GRADIENT = "${buf.toString("base64")}";\n`,
);
console.log(`gradient: ${Math.round(buf.length / 1024)} KB`);
