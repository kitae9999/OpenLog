#!/usr/bin/env bash

set -euo pipefail

for command in gcloud ssh scp; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "required command not found: $command" >&2
    exit 1
  fi
done

if [[ -z "${OCI_SSH_PRIVATE_KEY:-}" ]]; then
  echo "set OCI_SSH_PRIVATE_KEY to the OCI VM private key" >&2
  exit 1
fi

GCP_PROJECT="${GCP_PROJECT:-openlog-490106}"
GCP_ZONE="${GCP_ZONE:-asia-northeast3-a}"
GCP_INSTANCE="${GCP_INSTANCE:-instance-20260423-083246}"
OCI_HOST="${OCI_HOST:-161.33.183.12}"
OCI_USER="${OCI_USER:-ubuntu}"
BACKUP_NAME="${BACKUP_NAME:-openlog-$(date -u +%Y%m%dT%H%M%SZ).dump}"
LOCAL_BACKUP="$(mktemp)"

cleanup() {
  rm -f "$LOCAL_BACKUP"
}
trap cleanup EXIT

gcloud compute ssh "$GCP_INSTANCE" \
  --project="$GCP_PROJECT" \
  --zone="$GCP_ZONE" \
  --tunnel-through-iap \
  --quiet \
  --command='sudo docker exec openlog-postgres-1 pg_dump -U openlog -d openlog --format=custom --no-owner' \
  > "$LOCAL_BACKUP"

if [[ ! -s "$LOCAL_BACKUP" ]]; then
  echo "PostgreSQL backup is empty" >&2
  exit 1
fi

scp \
  -i "$OCI_SSH_PRIVATE_KEY" \
  -o BatchMode=yes \
  "$LOCAL_BACKUP" \
  "$OCI_USER@$OCI_HOST:/opt/openlog/backups/$BACKUP_NAME"

ssh \
  -i "$OCI_SSH_PRIVATE_KEY" \
  -o BatchMode=yes \
  "$OCI_USER@$OCI_HOST" \
  "chmod 600 '/opt/openlog/backups/$BACKUP_NAME'"

echo "copied PostgreSQL backup to $OCI_HOST:/opt/openlog/backups/$BACKUP_NAME"
