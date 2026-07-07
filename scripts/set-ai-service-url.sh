#!/usr/bin/env bash
# Set AI_SERVICE_URL on Vercel after deploying ai-service to Render.
# Usage: ./scripts/set-ai-service-url.sh https://job-tracker-ai-service.onrender.com
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <AI_SERVICE_URL>"
  echo "Example: $0 https://job-tracker-ai-service.onrender.com"
  exit 1
fi

URL="${1%/}" # strip trailing slash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT/apps/web"

for env in production preview development; do
  npx vercel env add AI_SERVICE_URL "$env" --value "$URL" --yes --force
done

echo ""
echo "AI_SERVICE_URL set to $URL on production, preview, and development."
echo "Redeploy Vercel for production: npx vercel --prod (from apps/web)"
