#!/usr/bin/env bash

set -euo pipefail

if [[ "${CONFIRM_CDC_RECOVERY:-}" != "reset-openlog-cdc" ]]; then
  echo "set CONFIRM_CDC_RECOVERY=reset-openlog-cdc to reset connector offsets and its replication slot" >&2
  exit 1
fi

script_path="${BASH_SOURCE[0]:-$0}"
script_dir="$(cd "$(dirname "$script_path")" && pwd)"
deploy_dir="${DEPLOY_PATH:-$(cd "${script_dir}/.." && pwd)}"

connect_url="${CONNECT_URL:-http://localhost:8083}"
connector_name="${DEBEZIUM_CONNECTOR_NAME:-openlog-outbox-cdc}"
slot_name="${DEBEZIUM_SLOT_NAME:-openlog_debezium}"

if [[ ! "$connector_name" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ ]]; then
  echo "invalid Debezium connector name: $connector_name" >&2
  exit 1
fi

if [[ ! "$slot_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "invalid Debezium slot name: $slot_name" >&2
  exit 1
fi

cd "$deploy_dir"

compose() {
  docker compose \
    -p openlog \
    --env-file production.env \
    -f docker-compose.production.yml \
    "$@"
}

connect_ready=false
for _ in {1..60}; do
  if curl -fsS "${connect_url}/connectors" >/dev/null; then
    connect_ready=true
    break
  fi
  sleep 2
done

if [[ "$connect_ready" != "true" ]]; then
  echo "debezium connect REST API did not become ready" >&2
  exit 1
fi

"${script_dir}/ensure-openlog-postgres-publication.sh" >/dev/null

connector_http_status="$(curl -sS -o /dev/null -w '%{http_code}' \
  "${connect_url}/connectors/${connector_name}/status")"

resume_connector=false
resume_on_exit() {
  if [[ "$resume_connector" == "true" ]]; then
    curl -fsS -X PUT "${connect_url}/connectors/${connector_name}/resume" >/dev/null || true
  fi
}
trap resume_on_exit EXIT

if [[ "$connector_http_status" == "200" ]]; then
  curl -fsS -X PUT "${connect_url}/connectors/${connector_name}/stop" >/dev/null
  resume_connector=true

  connector_stopped=false
  for _ in {1..30}; do
    connector_status="$(curl -fsS "${connect_url}/connectors/${connector_name}/status")"
    if [[ "$connector_status" == *'"connector":{"state":"STOPPED"'* ]]; then
      connector_stopped=true
      break
    fi
    sleep 2
  done

  if [[ "$connector_stopped" != "true" ]]; then
    echo "Debezium connector did not stop before CDC reset" >&2
    exit 1
  fi

  curl -fsS -X DELETE "${connect_url}/connectors/${connector_name}/offsets" >/dev/null
elif [[ "$connector_http_status" != "404" ]]; then
  echo "unexpected connector status response: HTTP $connector_http_status" >&2
  exit 1
fi

compose exec -T postgres sh -c \
  'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"' \
  sh \
  -v "slot_name=$slot_name" <<'SQL' >/dev/null
SELECT 1 / CASE WHEN NOT EXISTS (
  SELECT 1
  FROM pg_replication_slots
  WHERE slot_name = :'slot_name'
    AND active
) THEN 1 ELSE 0 END AS slot_inactive;

SELECT pg_drop_replication_slot(slot_name)
FROM pg_replication_slots
WHERE slot_name = :'slot_name';
SQL

if [[ "$connector_http_status" == "200" ]]; then
  curl -fsS -X PUT "${connect_url}/connectors/${connector_name}/resume" >/dev/null
  resume_connector=false
else
  "${script_dir}/register-openlog-postgres-connector.sh" >/dev/null
fi

cdc_ready=false
for _ in {1..60}; do
  if "${script_dir}/check-openlog-postgres-cdc.sh" >/dev/null 2>&1; then
    cdc_ready=true
    break
  fi
  sleep 2
done

if [[ "$cdc_ready" != "true" ]]; then
  "${script_dir}/check-openlog-postgres-cdc.sh"
  exit 1
fi

echo "reset Debezium offsets and replication slot; OpenLog PostgreSQL CDC is ready"
