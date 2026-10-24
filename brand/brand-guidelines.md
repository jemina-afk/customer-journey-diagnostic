# Tulivo Digital

Calm, premium and quietly confident. Tulivo takes its name from the Swahili word *tulivu*, meaning calm, and every surface should feel like a trusted adviser rather than a busy agency: editorial, moody and warm, with plenty of space doing the work that decoration usually does.

The written version of these guidelines lives in the [Tulivo Digital Brand Guidelines doc](https://claude.ai/artifact/Q6toiAh5sBKBW2q8MZtud7). This system is the visual reference: colours, type, components and examples.

Signature features: the lowercase serif wordmark, navy and plum backgrounds, the grainy signature gradient, and hand-drawn line illustrations.

## Logo

The logo is a lowercase serif **tulivo** with **DIGITAL** in small, widely spaced capitals centred underneath. Every version is in the `logos` folder, as PNG and SVG files. Always use those files rather than retyping the logo.

- The original is two-tone, with a plum (#2A1A3D) wordmark and `deep-purple` DIGITAL.
- On light backgrounds, use the original or the black version. On navy, plum, gradient or photo backgrounds, use the white version.
- For the profile picture, use the lilac square. For the favicon, use the logo's own "t" on lilac.
- Leave clear space around it of at least the height of the letter "t".
- Never stretch it, recolour it blue or pink, or add shadows or glows.
- In written copy the name is "Tulivo Digital", with capitals.

## Colour

Navy and the warm neutrals do most of the work. Purple, plum and lilac are accents, and they carry the brand's personality.

- **Website:** `off-white` is the page, `warm-grey` marks alternate sections, and `dark-accent` is for the nav, buttons and other dark elements.
- **Carousels and dark surfaces:** `navy` is the main surface, `cream` is the relief slide and the text colour on navy, and `lilac` highlights one or two key words.
- **Accents:** `deep-purple` is for icons and line drawings on light backgrounds. `plum` appears in the signature gradient and on document covers.
- Blue and pink are not part of the brand. The older document purples (#0E0720, #6414A0, #7828C8) are being phased out.
- Never put `lilac` or `deep-purple` text on `cream` or `off-white`, and never put grey text on a gradient.

## The signature gradient

The gradient is mostly `navy`, with `deep-purple`, `plum` and small touches of `lilac`, always finished with a subtle grain. It's reserved for key moments so that it stays special:

- **Website hero and final call to action:** slow-moving, and still if the visitor's device asks for reduced motion.
- **PDF, guide and diagnostic covers:** the same gradient, kept still, with the grain, the white wordmark and an Italiana title.
- Keep it dark enough that white text is always easy to read. Buttons on it are `cream` with `navy` text.
- Never use glowing gradients on text slides, and never use blue or pink in it.

The `.tulivo-gradient` class in `tokens.css` builds it for you.

## Typography

Each channel has a fixed set of fonts. Stick to these and don't add any others.

| Role | Font | Where |
| --- | --- | --- |
| Display headlines | Italiana 400 | Big headlines and section titles on the website and designed PDFs |
| Secondary serif | Cormorant Garamond | Card titles, quotes and smaller headings |
| Body | Inter | Paragraphs, labels, buttons and navigation |
| Carousel text | Schibsted Grotesk 400 and 600 | Carousel slides |
| Reel and moment text | Newsreader italic 300 | Reel covers and short emotional lines |
| Word documents | Calibri | Proposals, agreements and editable client documents |

Italiana only comes in one weight, so keep it at least 34px on mobile, keep headlines short, and keep word spacing natural. Write headlines in sentence case, and highlight one or two key words in `lilac` on navy rather than using bold.

## Illustrations and icons

Tulivo uses custom hand-drawn line illustrations, never stock icon sets, 3D icons or emoji.

- They're single-weight, slightly imperfect pen-sketch lines with rounded ends.
- Use `deep-purple` on light backgrounds and `lilac` on navy.
- Don't use fills, except for one or two small solid dots.
- Don't use background tiles, 3D effects, gradients, shadows or sparkles.
- Use one drawing per card or slide, always about the idea it sits next to.
- Every drawing in a set should look like it was drawn by the same hand.

Examples are in the `illustrations` folder.

## Photography

Use realistic, moody, editorial images, such as textures, interiors, devices, treatment rooms and calm everyday moments. Not every image needs a person, and when people appear they should look real, never AI-generated. A violet colour grade works well for reel covers. Don't use product shots, glowing backgrounds or busy stock imagery. On Instagram, the collage style (torn paper, clips, envelopes and handwritten notes over photos) should look like real cut-outs, not cartoons.

## Layout and components

- Keep layouts spacious and calm, with one clear action per section.
- Buttons are pill-shaped (`radius-pill`): `dark-accent` with white text on light backgrounds, and `cream` with `navy` text on dark or gradient backgrounds. Use the same capitalisation on every button.
- "Book a free call" is always the primary button. The free audit is a secondary text link.
- Section labels are a short thin rule followed by a small `label-grey` label.
- Cards have thin borders on `off-white`, with consistent corners and shadows across the site.
- The nav and footer must use the same wording and capitalisation.

## Carousels (8-stage series)

- **Rhythm:** cover = navy, intro = cream, moment = navy, why = cream, cost = navy, fixes = cream, checklist = cream, CTA = navy.
- **Layout:** left-aligned with `margin` (96px) on all sides, never centred, and `stack` (48px) between headline and body. Corners are always square (`radius-none`).
- **Stage meter:** eight ticks, each 64 x 4px, with `tick-gap` between them and `meter-top` from the top edge. Completed and current stages fill `deep-purple` on cream or `lilac` on navy. Remaining stages sit at 20% opacity, and the current tick is 8px tall.
- **Line drawing:** one per slide, bottom right, within a 400px box.
- **Instagram crop:** the cover becomes the grid thumbnail, cropped to the centre 1080 x 1080 square, so keep all cover text between y 135 and y 1215.
- On navy, `muted-on-navy` is for the stage tag and footer. On cream, use `muted-on-cream`.

## Tone of voice

Tulivo sounds like a knowledgeable friend: warm and conversational, but still professional. Copy should be informative without ever feeling stiff or template-like.

- Use British English, with hyphens rather than em dashes.
- Use plain words, with no jargon or AI-sounding phrasing.
- Let sentences flow into each other, and never stack three short punchy fragments in a row.
- Be friendly but not overly casual. For example, say "talk" rather than "chat".
- Keep copy easy to read on a phone, including for dyslexic readers.
- Describe clients as businesses that need help building their systems, never as "small businesses".
- Introduce the founder's background as "I spent 10 years...", and describe past employers generically.
