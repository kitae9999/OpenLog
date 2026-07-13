#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v ansible-playbook >/dev/null 2>&1; then
  echo "ansible-playbook is required" >&2
  exit 1
fi

if [[ -z "${ANSIBLE_PRIVATE_KEY_FILE:-}" ]]; then
  echo "set ANSIBLE_PRIVATE_KEY_FILE to the OCI VM private key" >&2
  exit 1
fi

cd "$SCRIPT_DIR"
ansible-galaxy collection install -r collections/requirements.yml
ansible-playbook playbooks/provision.yml "$@"
