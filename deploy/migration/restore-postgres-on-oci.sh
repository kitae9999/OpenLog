#!/usr/bin/env bash

set -euo pipefail

if [[ "${CONFIRM_RESTORE:-}" != "restore-openlog-production" ]]; then
  echo "set CONFIRM_RESTORE=restore-openlog-production to restore the target database" >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "usage: $0 /opt/openlog/backups/openlog-YYYYMMDDTHHMMSSZ.dump" >&2
  exit 1
fi

BACKUP_PATH="$1"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/openlog}"

if [[ ! -s "$BACKUP_PATH" ]]; then
  echo "backup does not exist or is empty: $BACKUP_PATH" >&2
  exit 1
fi

cd "$DEPLOY_PATH"

compose() {
  docker compose \
    -p openlog \
    --env-file production.env \
    -f docker-compose.production.yml \
    "$@"
}

# Keep the target database isolated while its schema and data are replaced.
compose stop nginx backend debezium
compose up -d postgres

postgres_ready=false
for _ in {1..30}; do
  if compose exec -T postgres sh -c \
    'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null; then
    postgres_ready=true
    break
  fi
  sleep 2
done

if [[ "$postgres_ready" != "true" ]]; then
  echo "target PostgreSQL did not become ready" >&2
  exit 1
fi

compose exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --exit-on-error' \
  < "$BACKUP_PATH"

compose exec -T postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE media_assets SET bucket = '\''openlog-media'\'' WHERE bucket = '\''openlog_prod'\'';"'

compose up -d

target_ready=false
for _ in {1..60}; do
  if curl --fail --silent http://127.0.0.1/healthz >/dev/null; then
    target_ready=true
    break
  fi
  sleep 2
done

if [[ "$target_ready" != "true" ]]; then
  echo "target OpenLog stack did not become healthy" >&2
  compose ps >&2
  exit 1
fi

echo "restored PostgreSQL backup, updated media bucket references, and verified the target stack"
