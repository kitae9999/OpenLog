#!/usr/bin/env bash

set -euo pipefail

script_path="${BASH_SOURCE[0]:-$0}"
script_dir="$(cd "$(dirname "$script_path")" && pwd)"
deploy_dir="${DEPLOY_PATH:-$(cd "${script_dir}/.." && pwd)}"

connect_url="${CONNECT_URL:-http://localhost:8083}"
connector_name="${DEBEZIUM_CONNECTOR_NAME:-openlog-outbox-cdc}"
publication_name="${DEBEZIUM_PUBLICATION_NAME:-openlog_publication}"
slot_name="${DEBEZIUM_SLOT_NAME:-openlog_debezium}"
database_user="${DEBEZIUM_DATABASE_USER:-openlog}"
outbox_table="${DEBEZIUM_OUTBOX_TABLE_INCLUDE_LIST:-public.outbox_events}"

for identifier in "$connector_name" "$publication_name" "$slot_name" "$database_user"; do
  if [[ ! "$identifier" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ ]]; then
    echo "invalid CDC identifier: $identifier" >&2
    exit 1
  fi
done

if [[ ! "$outbox_table" =~ ^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)$ ]]; then
  echo "expected one schema-qualified Debezium outbox table, got: $outbox_table" >&2
  exit 1
fi

table_schema="${BASH_REMATCH[1]}"
table_name="${BASH_REMATCH[2]}"

cd "$deploy_dir"

compose() {
  docker compose \
    -p openlog \
    --env-file production.env \
    -f docker-compose.production.yml \
    "$@"
}

connector_status="$(curl -fsS "${connect_url}/connectors/${connector_name}/status")"

if [[ "$connector_status" != *'"connector":{"state":"RUNNING"'* ]]; then
  echo "Debezium connector is not RUNNING: $connector_status" >&2
  exit 1
fi

if [[ "$connector_status" != *'"tasks":[{"id":0,"state":"RUNNING"'* ]]; then
  echo "Debezium connector task 0 is not RUNNING: $connector_status" >&2
  exit 1
fi

database_state="$(compose exec -T postgres sh -c \
  'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 "$@"' \
  sh \
  -v "publication_name=$publication_name" \
  -v "slot_name=$slot_name" \
  -v "database_user=$database_user" \
  -v "table_schema=$table_schema" \
  -v "table_name=$table_name" <<'SQL'
SELECT
  (EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = :'publication_name'
  ))::int || '|' ||
  (EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = :'publication_name'
      AND schemaname = :'table_schema'
      AND tablename = :'table_name'
  ))::int || '|' ||
  (EXISTS (
    SELECT 1
    FROM pg_replication_slots
    WHERE slot_name = :'slot_name'
      AND slot_type = 'logical'
      AND plugin = 'pgoutput'
      AND database = current_database()
      AND active
  ))::int || '|' ||
  (EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = :'database_user'
      AND (rolreplication OR rolsuper)
  ))::int || '|' ||
  has_table_privilege(
    :'database_user',
    format('%I.%I', :'table_schema', :'table_name'),
    'SELECT'
  )::int;
SQL
)"

if [[ "$database_state" != "1|1|1|1|1" ]]; then
  echo "PostgreSQL CDC state is not ready (publication|table|active-slot|replication-role|select): $database_state" >&2
  exit 1
fi

echo "OpenLog PostgreSQL CDC is ready"
