#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v ansible-playbook >/dev/null 2>&1; then
  echo "ansible-playbook is required" >&2
  exit 1
fi

if [[ -z "${ANSIBLE_PRIVATE_KEY_FILE:-}" && -z "${SSH_AUTH_SOCK:-}" ]]; then
  echo "set ANSIBLE_PRIVATE_KEY_FILE or start an SSH agent with the OCI VM private key" >&2
  exit 1
fi

cd "$SCRIPT_DIR"
ansible-galaxy collection install -r collections/requirements.yml
ansible-playbook playbooks/provision.yml "$@"
