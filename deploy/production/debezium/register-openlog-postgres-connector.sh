#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

connect_url="${CONNECT_URL:-http://localhost:8083}"
connector_name="${DEBEZIUM_CONNECTOR_NAME:-openlog-outbox-cdc}"
config_file="${1:-"${script_dir}/openlog-postgres-connector.json"}"

curl -fsS \
  -X PUT \
  -H "Content-Type: application/json" \
  --data-binary @"${config_file}" \
  "${connect_url}/connectors/${connector_name}/config"

printf "\n"
