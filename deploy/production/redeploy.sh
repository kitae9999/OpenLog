#!/usr/bin/env bash

set -euo pipefail

if [[ $# -eq 0 ]]; then
  set -- kafka debezium backend
fi

includes_service() {
  local service

  for service in "$@"; do
    if [[ "$service" == "debezium" ]]; then
      return 0
    fi
  done

  return 1
}

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

if includes_service "$@"; then
  debezium_ready=false

  for _ in {1..30}; do
    if curl -fsS http://localhost:8083/connectors >/dev/null; then
      debezium_ready=true
      break
    fi

    sleep 2
  done

  if [[ "$debezium_ready" != "true" ]]; then
    echo "debezium connect REST API did not become ready" >&2
    exit 1
  fi

  ./debezium/register-openlog-postgres-connector.sh >/dev/null
fi

docker image prune -f >/dev/null 2>&1 || true
