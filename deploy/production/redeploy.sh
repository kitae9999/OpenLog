#!/usr/bin/env bash

set -euo pipefail

if [[ $# -eq 0 ]]; then
  set -- backend
fi

docker compose \
  -p openlog \
  --env-file production.env \
  -f docker-compose.production.yml \
  pull "$@"

docker compose \
  -p openlog \
  --env-file production.env \
  -f docker-compose.production.yml \
  up -d "$@"

docker image prune -f >/dev/null 2>&1 || true
