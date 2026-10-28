#!/bin/sh
# Builds the sample report from the test answers, through the real scoring and
# PDF code rather than a copy of it. The library is TypeScript and this runs in
# plain node, so it is compiled to .sample-build first.
#
#   sh scripts/sample/build.sh [output.pdf]
set -e
cd "$(dirname "$0")/../.."
OUT=${1:-public/customer-journey-diagnostic-sample-report.pdf}

rm -rf .sample-build
npx tsc src/lib/diagnostic/*.ts \
  --outDir .sample-build --module esnext --target es2022 \
  --moduleResolution bundler --resolveJsonModule --skipLibCheck --strict false

# tsc writes bare "./scoring" specifiers; node needs the extension. Node also
# insists on an import attribute for JSON, which bundlers do not, so it is added
# here rather than carried in the source.
(cd .sample-build/src/lib/diagnostic && sed -i -E 's#(from "\./[a-zA-Z]+)";#\1.js";#g' *.js)
sed -i 's#from "../../../content/tools.json";#from "../../../content/tools.json" with { type: "json" };#' \
  .sample-build/src/lib/diagnostic/tools.js

cp scripts/sample/build-sample-report.mjs .sample-build/sample.mjs
(cd .sample-build && sed -i 's#\./lib/#./src/lib/diagnostic/#g' sample.mjs && node sample.mjs "../$OUT")
