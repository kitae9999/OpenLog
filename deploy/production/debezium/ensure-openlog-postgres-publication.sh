#!/usr/bin/env bash

set -euo pipefail

script_path="${BASH_SOURCE[0]:-$0}"
script_dir="$(cd "$(dirname "$script_path")" && pwd)"
deploy_dir="${DEPLOY_PATH:-$(cd "${script_dir}/.." && pwd)}"

publication_name="${DEBEZIUM_PUBLICATION_NAME:-openlog_publication}"
outbox_table="${DEBEZIUM_OUTBOX_TABLE_INCLUDE_LIST:-public.outbox_events}"

if [[ ! "$publication_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "invalid Debezium publication name: $publication_name" >&2
  exit 1
fi

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

compose exec -T postgres sh -c \
  'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"' \
  sh \
  -v "publication_name=$publication_name" \
  -v "table_schema=$table_schema" \
  -v "table_name=$table_name" <<'SQL'
SELECT format(
  'CREATE PUBLICATION %I FOR TABLE %I.%I',
  :'publication_name',
  :'table_schema',
  :'table_name'
)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_publication
  WHERE pubname = :'publication_name'
)
\gexec

SELECT format(
  'ALTER PUBLICATION %I SET TABLE %I.%I',
  :'publication_name',
  :'table_schema',
  :'table_name'
)
WHERE (
  SELECT count(*)
  FROM pg_publication_tables
  WHERE pubname = :'publication_name'
) <> 1
OR NOT EXISTS (
  SELECT 1
  FROM pg_publication_tables
  WHERE pubname = :'publication_name'
    AND schemaname = :'table_schema'
    AND tablename = :'table_name'
)
\gexec

SELECT 1 / CASE WHEN EXISTS (
  SELECT 1
  FROM pg_publication_tables
  WHERE pubname = :'publication_name'
    AND schemaname = :'table_schema'
    AND tablename = :'table_name'
) THEN 1 ELSE 0 END AS publication_ready;
SQL
