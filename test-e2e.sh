#!/usr/bin/env bash
# Builds the library and runs the browser tests against the demo pages (static server inside the Playwright container).
set -euo pipefail
cd "$(dirname "$0")"
./node.sh npm test
./node.sh npm run build
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD/e2e:/app" -w /app node:22-alpine npm ci --no-audit --no-fund --ignore-scripts --silent
docker run --rm --ipc=host -u "$(id -u):$(id -g)" -e HOME=/tmp -e CI=1 -v "$PWD:/site" -w /site mcr.microsoft.com/playwright:v1.64.0-noble \
  sh -c 'python3 -m http.server 8000 >/dev/null 2>&1 & cd e2e && npx playwright test'
