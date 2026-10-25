/*
  Records the drop-off animation to MP4, for reels and for the website.

    npm run dev          # in another terminal
    node scripts/record-animation.mjs

  Walks /animation one frame at a time with the clock frozen, screenshots each
  frame, and hands them to ffmpeg. Stepping the clock rather than filming in
  real time means every frame is complete: no half-painted text, no dropped
  frames, and the same file every run.

  Writes to public/animation/. Needs a full ffmpeg on PATH: the one bundled
  with Playwright is a stripped build that cannot write H.264.
*/

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3225";
const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FPS = 25;
const OUT = "public/animation";

const SIZES = {
  "9x16": { w: 1080, h: 1920 },
  "1x1": { w: 1080, h: 1080 },
  "16x9": { w: 1920, h: 1080 },
};

/** Kept in step with DURATION in src/components/journey/model.ts. */
const DURATION = 5.5 + 8 * (2.4 + 1.4 + 1.4) + 6.5 + 5;

const CUTS = [
  { variant: "leaking", ratio: "9x16", theme: "navy", name: "leaking-reel" },
  { variant: "fixed", ratio: "9x16", theme: "navy", name: "fixed-reel" },
  { variant: "leaking", ratio: "1x1", theme: "light", name: "leaking-square" },
  { variant: "fixed", ratio: "1x1", theme: "navy", name: "fixed-square" },
  { variant: "leaking", ratio: "16x9", theme: "light", name: "leaking-wide" },
  { variant: "fixed", ratio: "16x9", theme: "navy", name: "fixed-wide" },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });

for (const cut of CUTS) {
  const { w, h } = SIZES[cut.ratio];
  const dir = `.frames-${cut.name}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const url = `${BASE}/animation?variant=${cut.variant}&ratio=${cut.ratio}&theme=${cut.theme}&t=0`;
  await page.goto(url, { waitUntil: "networkidle" });
  // The fonts must be ready, or early frames land in the fallback serif.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => typeof window.__jfSetTime === "function");

  const total = Math.round(DURATION * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.__jfSetTime(t), i / FPS);
    // JPEG frames encode several times faster than PNG at this size, and the
    // difference does not survive H.264 anyway.
    const shot = await page.screenshot({ type: "jpeg", quality: 94 });
    writeFileSync(`${dir}/f${String(i).padStart(4, "0")}.jpg`, shot);
  }
  await page.close();

  const mp4 = `${OUT}/${cut.name}.mp4`;
  const res = spawnSync(
    FFMPEG,
    [
      "-y", "-framerate", String(FPS), "-i", `${dir}/f%04d.jpg`,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
      // Instagram and most players want even dimensions and a standard profile.
      "-profile:v", "high", "-level", "4.0", "-movflags", "+faststart",
      mp4,
    ],
    { stdio: "pipe" },
  );
  if (res.status !== 0) {
    console.error(res.stderr?.toString().split("\n").slice(-6).join("\n"));
    throw new Error(`ffmpeg failed for ${cut.name}`);
  }
  rmSync(dir, { recursive: true, force: true });
  console.log(`${mp4}  ${total} frames  ${DURATION.toFixed(1)}s`);
}

await browser.close();
