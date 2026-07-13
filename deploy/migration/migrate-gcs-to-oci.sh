#!/usr/bin/env bash

set -euo pipefail

for command in gcloud oci jq; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "required command not found: $command" >&2
    exit 1
  fi
done

GCS_BUCKET="${GCS_BUCKET:-openlog_prod}"
OCI_BUCKET="${OCI_BUCKET:-openlog-media}"
OCI_NAMESPACE="${OCI_NAMESPACE:-$(oci os ns get --query data --raw-output)}"
WORK_DIR="$(mktemp -d)"
OBJECT_DIR="$WORK_DIR/objects"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

mkdir -p "$OBJECT_DIR"

gcloud storage rsync --recursive "gs://$GCS_BUCKET" "$OBJECT_DIR"

oci os object bulk-upload \
  --namespace-name "$OCI_NAMESPACE" \
  --bucket-name "$OCI_BUCKET" \
  --src-dir "$OBJECT_DIR" \
  --overwrite \
  --no-follow-symlinks >/dev/null

find "$OBJECT_DIR" -type f -print \
  | sed "s#^$OBJECT_DIR/##" \
  | LC_ALL=C sort > "$WORK_DIR/source-objects.txt"

oci os object list \
  --namespace-name "$OCI_NAMESPACE" \
  --bucket-name "$OCI_BUCKET" \
  --all \
  --output json \
  | jq -r '.data[].name' \
  | LC_ALL=C sort > "$WORK_DIR/target-objects.txt"

if ! diff -u "$WORK_DIR/source-objects.txt" "$WORK_DIR/target-objects.txt"; then
  echo "GCS and OCI object names do not match" >&2
  exit 1
fi

OBJECT_COUNT="$(wc -l < "$WORK_DIR/source-objects.txt" | tr -d ' ')"
echo "migrated and verified $OBJECT_COUNT objects: gs://$GCS_BUCKET -> oci://$OCI_BUCKET"
