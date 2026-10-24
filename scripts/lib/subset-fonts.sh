#!/bin/sh
# Cuts the brand fonts down to the characters these documents use. jsPDF embeds
# whole fonts, so without this a ten-page guide carries 1.6MB of glyphs nobody
# will ever see.
set -e
cd "$(dirname "$0")/../.."
mkdir -p brand/fonts/subset
for f in brand/fonts/*.ttf; do
  python3.13 -m fontTools.subset "$f" \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2018-201D,U+2026,U+2013,U+2014,U+00A3,U+20AC,U+00D7,U+00F7,U+00B7" \
    --layout-features='' --no-hinting --desubroutinize \
    --output-file="brand/fonts/subset/$(basename "$f")"
done
echo "subset fonts written to brand/fonts/subset"
