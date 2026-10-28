#!/bin/sh
# Runs the report invariants against every test profile.
#
#   sh scripts/validate/validate.sh          # checks only, fast
#   sh scripts/validate/validate.sh --pdf    # also writes public/samples/*.pdf
set -e
cd "$(dirname "$0")/../.."

rm -rf .validate
npx tsc src/lib/diagnostic/*.ts \
  --outDir .validate --module esnext --target es2022 \
  --moduleResolution bundler --resolveJsonModule --skipLibCheck --strict false

(cd .validate/src/lib/diagnostic && sed -i -E 's#(from "\./[a-zA-Z]+)";#\1.js";#g' *.js)
sed -i 's#from "../../../content/tools.json";#from "../../../content/tools.json" with { type: "json" };#' \
  .validate/src/lib/diagnostic/tools.js

cp scripts/validate/run.mjs .validate/run.mjs
(cd .validate && sed -i 's#\./lib/#./src/lib/diagnostic/#g' run.mjs && node run.mjs "$@")
