#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${1:-/opt/openlog/production.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "production env file not found: $ENV_FILE" >&2
  exit 1
fi

# Normalize line endings copied from the legacy VM before matching keys.
LC_ALL=C sed -i $'s/\xE2\x80\xA8//g; s/\r$//' "$ENV_FILE"

upsert() {
  local key="$1"
  local value="$2"

  sed -i "/^${key}=/d" "$ENV_FILE"
  printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
}

upsert MEDIA_STORAGE_PROVIDER oci
upsert MEDIA_BUCKET_NAME openlog-media
upsert OCI_OBJECT_STORAGE_NAMESPACE nrmx0ag4fibk
upsert OCI_REGION ap-tokyo-1
upsert BACKEND_IMAGE openlog/backend:oci-migration

chmod 600 "$ENV_FILE"
echo "configured OCI production environment without printing secret values"
