#!/usr/bin/env bash

set -euo pipefail

if [[ $# -eq 0 ]]; then
  set -- kafka debezium backend mcp
fi

includes_service() {
  local service
  local target="${1}"
  shift

  for service in "$@"; do
    if [[ "$service" == "$target" ]]; then
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

if includes_service "debezium" "$@"; then
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

  ./debezium/ensure-openlog-postgres-publication.sh >/dev/null
  ./debezium/register-openlog-postgres-connector.sh >/dev/null

  cdc_ready=false
  for _ in {1..60}; do
    if ./debezium/check-openlog-postgres-cdc.sh >/dev/null 2>&1; then
      cdc_ready=true
      break
    fi
    sleep 2
  done

  if [[ "$cdc_ready" != "true" ]]; then
    ./debezium/check-openlog-postgres-cdc.sh
    exit 1
  fi
fi

if includes_service "backend" "$@" || includes_service "mcp" "$@" || includes_service "nginx" "$@"; then
  docker compose \
    -p openlog \
    --env-file production.env \
    -f docker-compose.production.yml \
    restart nginx
fi

if [[ -x /usr/local/sbin/openlog-refresh-alloy-access ]]; then
  sudo -n /usr/local/sbin/openlog-refresh-alloy-access
fi

mcp_container_id="$(
  docker compose \
    -p openlog \
    --env-file production.env \
    -f docker-compose.production.yml \
    ps -q mcp
)"
if [[ -n "$mcp_container_id" ]]; then
  # The Alloy host ACL refresh can make Docker's runtime network files unreadable to the
  # non-root Node process. Restore Docker's normal permissions before verifying backend DNS.
  docker compose \
    -p openlog \
    --env-file production.env \
    -f docker-compose.production.yml \
    exec -T --user root mcp \
    chmod 0644 /etc/hostname /etc/hosts /etc/resolv.conf

  docker compose \
    -p openlog \
    --env-file production.env \
    -f docker-compose.production.yml \
    exec -T mcp \
    node -e "fetch('http://backend:9090/actuator/health/readiness').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
fi

docker image prune -f >/dev/null 2>&1 || true
