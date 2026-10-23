# Generating the sample report

The sample report is produced by the real scoring and PDF code, not written by
hand, so it stays correct when the model changes. It needs a compile step
because the library is TypeScript and this script runs in plain node.

    npx tsc src/lib/diagnostic/*.ts --outDir .sample-build/lib \
      --module esnext --target es2022 --moduleResolution bundler \
      --skipLibCheck --strict false
    cd .sample-build/lib && sed -i -E 's#(from "\./[a-zA-Z]+)";#\1.js";#g' *.js && cd ../..
    cp scripts/sample/build-sample-report.mjs .sample-build/sample.mjs
    cd .sample-build && node sample.mjs ../public/customer-journey-diagnostic-sample-report.pdf

Lumen Skin Clinic is fictional. The answers in the script describe the most
common shape a real business turns up in: good at being found, poor at
answering, leaking quietly everywhere after that. The script stamps the output
as a sample so it can never be mistaken for a client's own data.
