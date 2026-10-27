/*
  The eight stages of a customer journey, as one picture.

    node scripts/build-journey-map.mjs

  Writes a landscape map and a portrait cut to public/, at 2x, for slides,
  posts and the guide. Everything is drawn from the brand tokens: navy ground,
  a ramp from deep purple through plum to lilac across the eight segments, and
  Switzer throughout.
*/

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";

const STAGES = [
  {
    title: "Lead sources and discovery",
    line: "Where new clients first hear about you, and how many places that is.",
    icon: "search",
  },
  {
    title: "Lead response",
    line: "How quickly an enquiry hears back, while they're still deciding.",
    icon: "reply",
  },
  {
    title: "Lead nurture and follow-up",
    line: "What happens when someone isn't ready to book straight away.",
    icon: "nurture",
  },
  {
    title: "Booking process",
    line: "How many steps sit between “I want this” and “it's in the diary”.",
    icon: "calendar",
  },
  {
    title: "Confirmation and pre-appointment",
    line: "What people receive between booking and arriving.",
    icon: "envelope",
  },
  {
    title: "Reminders and no-show prevention",
    line: "How you make sure booked clients actually turn up.",
    icon: "bell",
  },
  {
    title: "Reviews and reputation",
    line: "How happy clients tell the next person who's looking.",
    icon: "star",
  },
  {
    title: "Retention and re-engagement",
    line: "How past clients are invited back, and how often they return.",
    icon: "repeat",
  },
];

/* Purple through plum to lilac, eight steps, so the eye reads a progression
   rather than eight unrelated colours. It starts lighter than the brand's deep
   purple, which is meant for light grounds and goes muddy on navy. Lilac is
   where the client comes back, and lilac is only ever used on navy. */
const RAMP = [
  "#6E4FA3",
  "#7A54A6",
  "#8858A2",
  "#965C9C",
  "#A66C9E",
  "#B182B4",
  "#BE9BCC",
  "#CBB6E8",
];

/* Line icons in the brand's own hand: one stroke weight, round caps, no fill. */
const ICONS = {
  search: '<circle cx="13" cy="13" r="8"/><path d="M19 19l7 7"/>',
  reply: '<path d="M4 7h24v14H10l-6 5z"/><path d="M10 13h12M10 17h7"/>',
  nurture: '<path d="M16 27V13"/><path d="M16 17c0-4-3-7-7-7 0 4 3 7 7 7z"/><path d="M16 20c0-4 3-7 7-7 0 4-3 7-7 7z"/>',
  calendar: '<rect x="4" y="7" width="24" height="21" rx="2"/><path d="M4 14h24M11 4v6M21 4v6"/><path d="M11 20h4"/>',
  envelope: '<rect x="3" y="8" width="26" height="18" rx="2"/><path d="M3 11l13 9 13-9"/>',
  bell: '<path d="M16 5a8 8 0 0 0-8 8c0 7-3 8-3 8h22s-3-1-3-8a8 8 0 0 0-8-8z"/><path d="M13 25a3 3 0 0 0 6 0"/>',
  star: '<path d="M16 5l3.4 6.9 7.6 1.1-5.5 5.4 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6L5 13l7.6-1.1z"/>',
  repeat: '<path d="M7 13a9 9 0 0 1 15-4l3 3"/><path d="M25 7v5h-5"/><path d="M25 19a9 9 0 0 1-15 4l-3-3"/><path d="M7 25v-5h5"/>',
};

const logo = readFileSync("public/brand/tulivo-logo-white.svg", "utf8");
const fontData = (w) =>
  readFileSync(`src/fonts/switzer-${w}.woff2`).toString("base64");

function column(stage, i, { colX, colW, trackY, up }) {
  const cx = colX + 11;
  const colour = RAMP[i];
  /* Alternating sides, as on a timeline: the eye zig-zags and each stage gets
     a full column to itself rather than half of one. */
  const marker = up ? trackY - 54 : trackY + 54;
  const blockY = up ? trackY - 286 : trackY + 74;

  return `
    <g>
      <line x1="${cx}" y1="${up ? marker : trackY + 12}" x2="${cx}" y2="${up ? trackY - 12 : marker}"
            stroke="${colour}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${marker}" r="7" fill="${colour}"/>
      <circle cx="${cx}" cy="${marker}" r="14" fill="none" stroke="${colour}"
              stroke-width="1.5" opacity="0.4"/>

      <g transform="translate(${colX} ${blockY})">
        <g stroke="${colour}" stroke-width="2" fill="none"
           stroke-linecap="round" stroke-linejoin="round">
          ${ICONS[stage.icon]}
        </g>
        <text class="num" x="0" y="64" fill="${colour}">${String(i + 1).padStart(2, "0")}</text>
        <foreignObject x="0" y="78" width="${colW - 34}" height="200">
          <div xmlns="http://www.w3.org/1999/xhtml" class="col">
            <p class="t">${stage.title}</p>
            <p class="d">${stage.line}</p>
          </div>
        </foreignObject>
      </g>
    </g>`;
}

function svg({ w, h }) {
  const M = 80;
  const trackW = w - M * 2;
  const colW = trackW / 8;
  const trackY = h / 2 + 86;

  const segments = RAMP.map((c, i) => {
    const x = M + i * colW;
    return `<rect x="${x + 4}" y="${trackY - 7}" width="${colW - 8}" height="14" rx="7" fill="${c}"/>`;
  }).join("");

  const columns = STAGES.map((s, i) =>
    column(s, i, { colX: M + i * colW + 16, colW, trackY, up: i % 2 === 0 }),
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B2138"/>
      <stop offset="55%" stop-color="#1D2140"/>
      <stop offset="100%" stop-color="#15192C"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.18" cy="0.12" r="0.55">
      <stop offset="0%" stop-color="#7A3F78" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#7A3F78" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.85" cy="0.85" r="0.5">
      <stop offset="0%" stop-color="#5B3A8C" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#5B3A8C" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#ground)"/>
  <rect width="${w}" height="${h}" fill="url(#glowA)"/>
  <rect width="${w}" height="${h}" fill="url(#glowB)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.05"/>

  <foreignObject x="${M}" y="64" width="${w - M * 2}" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" class="band">
      <p class="eyebrow">The customer journey</p>
      <div class="bandrow">
        <p class="h1">Eight stages, from the first search to the second booking</p>
        <p class="sub">Every client you have ever had walked these eight steps. Each one holds or leaks on its own, and the diagnostic scores them one at a time.</p>
      </div>
    </div>
  </foreignObject>
  <line x1="${M}" y1="258" x2="${w - M}" y2="258" stroke="#FAF7F3" stroke-opacity="0.12" stroke-width="1"/>

  <!-- The dotted centre line runs the whole width, so the journey reads as one
       continuous thing that the segments only divide up. -->
  <line x1="${M}" y1="${trackY}" x2="${M + trackW}" y2="${trackY}"
        stroke="#FAF7F3" stroke-opacity="0.3" stroke-width="2"
        stroke-dasharray="2 8" stroke-linecap="round"/>
  ${segments}
  ${columns}

  <g transform="translate(${M} ${h - 96})">${logoInner()}</g>
  <text class="foot" x="${w - M}" y="${h - 66}" text-anchor="end">tulivodigital.com</text>
</svg>`;
}

/* The real logo file, never retyped: its paths are lifted straight in. */
function logoInner() {
  const inner = logo.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const vb = /viewBox="([^"]+)"/.exec(logo);
  const [, , vw, vh] = vb ? vb[1].split(/\s+/).map(Number) : [0, 0, 100, 40];
  const scale = 44 / vh;
  return `<g transform="scale(${scale})">${inner}</g>`;
}

function page({ w, h, titleSize, bodySize }) {
  return `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: Switzer; font-weight: 400; src: url(data:font/woff2;base64,${fontData(400)}) format('woff2'); }
  @font-face { font-family: Switzer; font-weight: 500; src: url(data:font/woff2;base64,${fontData(500)}) format('woff2'); }
  @font-face { font-family: Switzer; font-weight: 600; src: url(data:font/woff2;base64,${fontData(600)}) format('woff2'); }
  html, body { margin: 0; background: #1B2138; }
  svg { display: block; font-family: Switzer, sans-serif; font-variant-numeric: lining-nums proportional-nums; }
  div { font-family: Switzer, sans-serif; }
  p { margin: 0; }
  .eyebrow { font-size: 17px; font-weight: 400; letter-spacing: 0.16em;
             text-transform: uppercase; color: #8C93A8; margin-bottom: 26px; }
  .bandrow { display: flex; align-items: flex-end; gap: 72px; }
  .h1 { flex: 1 1 56%; font-size: ${titleSize}px; font-weight: 500;
        line-height: 1.04; letter-spacing: -0.042em; color: #FAF7F3;
        max-width: 22ch; }
  .sub { flex: 1 1 44%; font-size: ${bodySize}px; font-weight: 400;
         line-height: 1.55; color: #8C93A8; max-width: 46ch; }
  .col { width: 100%; }
  .t { font-size: 21px; font-weight: 500; line-height: 1.16;
       letter-spacing: -0.035em; color: #FAF7F3; }
  .d { margin-top: 10px; font-size: 15.5px; font-weight: 400; line-height: 1.45;
       color: #949AAD; }
  .num { font-size: 15px; font-weight: 500; letter-spacing: 0.1em; }
  .foot { font-size: 15px; fill: #8C93A8; }
</style>
${svg({ w, h })}`;
}

const browser = await chromium.launch({ executablePath: CHROME });
mkdirSync("public", { recursive: true });

/* One design, rendered twice: the same picture at 1x for the web and 2x for
   print and slides. Scaling the device rather than the type keeps the layout
   identical between the two files. */
const W = 2400;
const H = 1120;
const TYPE = { titleSize: 58, bodySize: 19 };

const CUTS = [
  { scale: 1, out: "public/the-eight-stages-map.png" },
  { scale: 2, out: "public/the-eight-stages-map-2x.png" },
];

for (const cut of CUTS) {
  const p = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: cut.scale,
  });
  await p.setContent(page({ w: W, h: H, ...TYPE }), { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  /* foreignObject clips silently, which is how a half-sentence ends up in a
     finished picture. Measure every block against the box it was given. */
  const clipped = await p.evaluate(() =>
    [...document.querySelectorAll("foreignObject")]
      .map((fo) => {
        const box = Number(fo.getAttribute("height"));
        const used = fo.firstElementChild.getBoundingClientRect().height;
        const text = fo.textContent.trim().slice(0, 40);
        return used > box ? `${text}… needs ${Math.ceil(used)}px of ${box}px` : null;
      })
      .filter(Boolean),
  );
  if (clipped.length) {
    throw new Error(`Text clipped in ${cut.out}:\n  ${clipped.join("\n  ")}`);
  }
  await p.screenshot({ path: cut.out });
  await p.close();
  console.log(`${cut.out}  ${W * cut.scale}x${H * cut.scale}`);
}

writeFileSync("public/the-eight-stages-map.svg", svg({ w: W, h: H }));
console.log("public/the-eight-stages-map.svg");
await browser.close();
