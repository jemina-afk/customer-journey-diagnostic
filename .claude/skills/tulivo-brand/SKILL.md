---
name: tulivo-brand
description: Apply Tulivo Digital's brand guidelines whenever creating Tulivo visuals, website pages, components, social posts, documents or copy. Uses the logo, colour, font and illustration files in the brand/ folder.
---

# Tulivo Digital brand guidelines

Use these rules for anything made for Tulivo Digital's own brand. Brand files live in the `brand/` folder at the root of this project:

- `brand/brand-guidelines.md` - the full brand book
- `brand/tokens.css` - colours, fonts and the signature gradient as CSS variables (import it rather than retyping values)
- `brand/tokens.json` - the same values as data
- `brand/logos/` - every logo version as SVG and PNG
- `brand/illustrations/` - hand-drawn line drawings in purple (light backgrounds) and lilac (navy backgrounds)

## Brand essence

Tulivo means calm (from the Swahili "tulivu"). The brand should feel calm, premium, editorial and quietly confident, like a trusted adviser rather than a busy agency.

## Logo

- Always use the files in `brand/logos/`. Never retype the logo in a font.
- Light backgrounds: `tulivo-logo-original` or `tulivo-logo-black`. Navy, plum, gradient or photo backgrounds: `tulivo-logo-white`.
- Favicon: `tulivo-favicon-t`. Profile pictures: `tulivo-profile-lilac` (or `tulivo-profile-navy`).
- Prefer the SVG versions on websites. Never stretch, outline, recolour or add shadows or glows.
- In copy the name is "Tulivo Digital".

## Colours

| Colour | Hex | Use |
| --- | --- | --- |
| Off-white | #F5F3EF | Main website background |
| Warm grey | #E9E7E2 | Alternate website sections |
| Dark accent | #131217 | Nav bar, buttons, dark elements |
| Navy | #1B2138 | Dark surfaces, gradient base, text on light |
| Deep purple | #5B3A8C | Icons and line drawings on light backgrounds |
| Plum | #7A3F78 | Gradient, document covers |
| Lilac | #CBB6E8 | Highlighted words and drawings on navy |
| Cream | #FAF7F3 | Text on navy, buttons on dark backgrounds |
| Label grey | #5A5A66 | Small labels on off-white |

Blue and pink are NOT part of the brand. Never put lilac or purple text on cream or off-white, or grey text on a gradient.

## Fonts

- Italiana (regular 400 only): big headlines and section titles. At least 34px on mobile, keep headlines short.
- Cormorant Garamond: card titles, quotes, smaller headings.
- Inter: body text, labels, buttons, navigation.
- Carousels: Schibsted Grotesk. Reels: Newsreader italic. Word documents: Calibri.
- Don't add any other fonts. Headlines in sentence case.

## Backgrounds and imagery

- Mostly flat off-white, warm grey or navy.
- The signature gradient (`.tulivo-gradient` in tokens.css) is for the website hero, final call-to-action sections and PDF or guide covers. Always grainy, mostly navy, never blue or pink. It moves slowly on the website (still if the device prefers reduced motion) and stays still on documents. Buttons on it are cream with navy text.
- Photography: realistic, moody, editorial. No product shots, glowing backgrounds or AI-looking images.

## Icons and illustrations

- Custom hand-drawn line drawings only (see `brand/illustrations/`). Never stock icon libraries, 3D icons or emoji.
- Single-weight, slightly imperfect lines, rounded ends, stroke width 2 on a 64 x 64 grid, no fills except small dots.
- Deep purple on light backgrounds, lilac on navy. One drawing per card or slide.

## Layout and components

- Spacious and calm, one clear action per section.
- Buttons are pill-shaped: dark accent with white text on light backgrounds, cream with navy text on dark or gradient backgrounds. Same capitalisation on every button.
- "Book a free call" is always the primary action; the free audit is a secondary text link.
- Section labels: a short thin line and a small label-grey label above an Italiana title.
- Nav and footer wording and capitalisation must match.

## Tone of voice

- Like a knowledgeable friend: warm, conversational, professional, never stiff or template-like.
- British English. Hyphens, never em dashes. Plain words, no jargon or AI-sounding phrasing.
- Flowing sentences. Never stack three short punchy sentences or fragments in a row.
- Say "talk", not "chat". Easy to read on a phone and for dyslexic readers.
- Founder background: "I spent 10 years..." in client-facing roles with global organisations. Never name past employers or clients, never mention redundancies, use the founder's name sparingly.
- Clients are businesses that need help building their systems, never "small businesses". Don't assume they pay for ads.

## Quick check before finishing

- No blue or pink, no stock or 3D icons, no glowing gradients on text sections.
- Only the fonts listed above, loaded via tokens.css.
- Real logo files used, text readable on every background, copy follows the tone rules.
