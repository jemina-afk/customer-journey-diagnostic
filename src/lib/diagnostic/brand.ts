/*
  Tulivo brand values for the report.

  Mirrors scripts/lib/brand.mjs, which the guide and the methodology use, so
  all three documents are drawn from the same palette and type. Colours come
  from brand/tokens.json.

  The rule that shapes the report: never put lilac or deep purple text on cream
  or off-white. On light pages text is navy or label-grey, purple is reserved
  for rules, ticks and other drawn marks, and lilac appears only on navy.
*/

export type RGB = [number, number, number];

export const OFF_WHITE: RGB = [245, 243, 239];
export const WARM_GREY: RGB = [233, 231, 226];
export const DARK: RGB = [19, 18, 23];
export const NAVY: RGB = [27, 33, 56];
export const PURPLE: RGB = [91, 58, 140];
export const PLUM: RGB = [122, 63, 120];
export const LILAC: RGB = [203, 182, 232];
export const CREAM: RGB = [250, 247, 243];
export const LABEL_GREY: RGB = [90, 90, 102];
export const MUTED_ON_NAVY: RGB = [140, 147, 168];
export const LINE: RGB = [216, 212, 205];
export const WHITE: RGB = [255, 255, 255];

/* Status colours sit outside the brand palette: a traffic light has to read as
   a traffic light. Shifted cooler to sit beside navy and purple. */
export const GREEN: RGB = [47, 110, 92];
export const AMBER: RGB = [176, 128, 48];
export const RED: RGB = [166, 58, 58];

/** Reading aliases, so page code says what it means. */
export const INK: RGB = NAVY;
export const MUTED: RGB = LABEL_GREY;
export const FAINT: RGB = [123, 123, 136];

/*
  One typeface, as on the page: Switzer. The three names are kept because the
  page code reads by role rather than by family, and because a second face may
  come back for a cover one day.
*/
export const DISPLAY = "Switzer";
export const SERIF = "Switzer";
export const SANS = "Switzer";
