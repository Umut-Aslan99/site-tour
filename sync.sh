#!/usr/bin/env bash
# Builds the library and copies it into every site that uses it (each site serves its own copy: no cross-origin script).
set -euo pipefail
cd "$(dirname "$0")"
./node.sh npm run build >/dev/null
declare -A TARGETS=(
  [portfolio]=~/projects/portfolio/site/public
  [maui-app]=~/projects/maui-app/site/public
  [einsatz]=~/projects/einsatz/web/static
  [erp-cockpit]=~/projects/erp-cockpit/web/public
  [lager-scan]=~/projects/lager-scan/web/public
  [maschinen-monitor]=~/projects/maschinen-monitor/web/public
  [kalkulation]=~/projects/kalkulation/api/src/Kalk.Web/wwwroot
)
for site in "${!TARGETS[@]}"; do
  dir="${TARGETS[$site]}"
  [ -n "${1:-}" ] && [ "$1" != "$site" ] && continue
  [ -d "$dir" ] || { echo "skip $site ($dir missing)"; continue; }
  { echo "/* site-tour $(git rev-parse --short HEAD 2>/dev/null || echo dev) – https://umut-aslan.dev */"; cat dist/site-tour.js; } > "$dir/site-tour.js"
  echo "$site ← $(wc -c < "$dir/site-tour.js") bytes"
done
