/*
  Shared Tulivo brand layer for the PDF generators.

  Colours come from brand/tokens.json, fonts from brand/fonts, and the gradient
  cover follows the .tulivo-gradient recipe in brand/tokens.css: mostly navy,
  with plum, deep purple and a touch of lilac, always finished with grain.

  The brand rule that shapes everything here: never put lilac or deep purple
  text on cream or off-white. On light pages, text is navy or label-grey and
  purple is reserved for rules, ticks and other drawn marks. Lilac appears only
  on navy and on the gradient.
*/

import { readFileSync } from "node:fs";
import { FONTS } from "./brand-fonts.mjs";
import { GRADIENT } from "./brand-gradient.mjs";

/* -------------------------------------------------------------- palette */

export const OFF_WHITE = [245, 243, 239];
export const WARM_GREY = [233, 231, 226];
export const DARK = [19, 18, 23];
export const NAVY = [27, 33, 56];
export const PURPLE = [91, 58, 140];
export const PLUM = [122, 63, 120];
export const LILAC = [203, 182, 232];
export const CREAM = [250, 247, 243];
export const LABEL_GREY = [90, 90, 102];
export const MUTED_ON_NAVY = [140, 147, 168];
export const MUTED_ON_CREAM = [102, 108, 132];
export const LINE = [216, 212, 205];
export const WHITE = [255, 255, 255];

/* Status colours sit outside the brand palette, because a traffic light has to
   read as a traffic light. Shifted cooler so they sit beside navy and purple. */
export const GREEN = [47, 110, 92];
export const AMBER = [176, 128, 48];
export const RED = [166, 58, 58];

/* Reading aliases, so page code says what it means. */
export const INK = NAVY;
export const MUTED = LABEL_GREY;
export const FAINT = [123, 123, 136];

/* ----------------------------------------------------------------- page */

export const PAGE_W = 210;
export const PAGE_H = 297;
export const M = 20;
export const COL_W = PAGE_W - M * 2;

/* ---------------------------------------------------------------- fonts */

export const DISPLAY = "Italiana";
export const SERIF = "Cormorant";
export const SANS = "Inter";

/** Registers the brand fonts on a jsPDF document. Call once, before drawing. */
export function registerFonts(doc) {
  const add = (key, name, style) => {
    const { file, data } = FONTS[key];
    doc.addFileToVFS(file, data);
    doc.addFont(file, name, style);
  };
  add("italiana", DISPLAY, "normal");
  add("interRegular", SANS, "normal");
  add("interSemiBold", SANS, "semibold");
  add("interBold", SANS, "bold");
  add("cormorantMedium", SERIF, "normal");
  add("cormorantSemiBold", SERIF, "bold");
}

/* --------------------------------------------------------------- assets */

/** The logo as PNG bytes, for jsPDF's addImage. */
export function logo(tone = "dark") {
  const file =
    tone === "light" ? "brand/logos/tulivo-logo-white.png" : "brand/logos/tulivo-logo-original.png";
  return readFileSync(file);
}

/** The logo lockup is 756 x 406 in its own units. */
export const LOGO_RATIO = 406 / 756;

/* ------------------------------------------------------------- gradient */

/*
  The signature gradient, rendered once from the same CSS the website uses and
  embedded as a print-resolution JPEG. Kept still, as documents require, with
  the grain already baked in.
*/
export function gradientPage(doc) {
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

/* ---------------------------------------------------------- type helpers */

/** Builds the drawing helpers bound to one document. */
export function helpers(doc) {
  function setText(size, colour, opts = {}) {
    const family = opts.font ?? SANS;
    doc.setFont(family, opts.weight ?? "normal");
    doc.setFontSize(size);
    doc.setTextColor(colour[0], colour[1], colour[2]);
    doc.setCharSpace(opts.charSpace ?? 0);
  }

  function paragraph(text, x, y, width, opts = {}) {
    const size = opts.size ?? 10;
    const leading = opts.leading ?? size * 0.52;
    setText(size, opts.colour ?? MUTED, opts);
    const lines = doc.splitTextToSize(text, width);
    lines.forEach((line, i) => doc.text(line, x, y + i * leading));
    return y + lines.length * leading;
  }

  /** A display heading in Italiana, sentence case, one or more lines. */
  function title(lines, x, y, size = 26, colour = INK, leading = size * 0.42) {
    setText(size, colour, { font: DISPLAY });
    lines.forEach((line, i) => doc.text(line, x, y + i * leading));
    return y + lines.length * leading;
  }

  /** A section label: a short thin rule, then a small label-grey label. */
  function label(text, x, y, opts = {}) {
    const ruleColour = opts.tone === "light" ? LILAC : PURPLE;
    const textColour = opts.tone === "light" ? MUTED_ON_NAVY : MUTED;
    doc.setDrawColor(ruleColour[0], ruleColour[1], ruleColour[2]);
    doc.setLineWidth(0.3);
    doc.line(x, y - 1.2, x + 7, y - 1.2);
    setText(opts.size ?? 8.5, textColour);
    doc.text(text, x + 10, y);
    return y;
  }

  function rule(y, x = M, w = COL_W, colour = LINE) {
    doc.setDrawColor(colour[0], colour[1], colour[2]);
    doc.setLineWidth(0.3);
    doc.line(x, y, x + w, y);
  }

  function fill(colour) {
    doc.setFillColor(colour[0], colour[1], colour[2]);
  }

  /** Square corners, as the brand asks for documents. */
  function panel(x, y, w, h, colour) {
    fill(colour);
    doc.rect(x, y, w, h, "F");
  }

  function bullet(text, x, y, width, colour = PURPLE, size = 9) {
    fill(colour);
    doc.circle(x + 1, y - 1.1, 0.8, "F");
    return paragraph(text, x + 4.5, y, width - 4.5, {
      size,
      colour: MUTED,
      leading: size * 0.47,
    });
  }

  /** Places the logo at a given height, keeping its proportions. */
  function placeLogo(x, y, height, tone = "dark") {
    const w = height / LOGO_RATIO;
    doc.addImage(logo(tone), "PNG", x, y, w, height, undefined, "FAST");
    return w;
  }

  return { setText, paragraph, title, label, rule, fill, panel, bullet, placeLogo };
}
