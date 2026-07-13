#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
LOOP="${1:-}"

cd "$FRONTEND"

if [[ ! -d node_modules/@playwright/test ]]; then
  echo "Installing @playwright/test..."
  pnpm add -D @playwright/test
fi

if [[ ! -d "$HOME/.cache/ms-playwright" ]] && [[ ! -d node_modules/.cache/ms-playwright ]]; then
  echo "Installing Playwright browsers..."
  pnpm exec playwright install chromium
fi

run_verify() {
  pnpm run verify:todos-ui
}

if [[ "$LOOP" == "--loop" ]]; then
  echo "Todos UI verify loop started. Press Ctrl+C to stop."
  while true; do
    if run_verify; then
      echo "Todos UI verification passed."
    else
      echo "Todos UI verification failed. Retrying in 3s..."
    fi
    sleep 3
  done
fi

echo "Running Todos UI Playwright verification..."
run_verify
echo "Todos UI verification passed."
