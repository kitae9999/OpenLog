#!/usr/bin/env bash

set -euo pipefail

for command in oci terraform jq; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "required command not found: $command" >&2
    exit 1
  fi
done

OCI_CONFIG_FILE="${OCI_CONFIG_FILE:-$HOME/.oci/config}"
OCI_CONFIG_PROFILE="${OCI_CONFIG_PROFILE:-DEFAULT}"
REGION="${OCI_REGION:-ap-tokyo-1}"
STATE_BUCKET="openlog-terraform-state"
INSTANCE_NAME="openlog-server"

TENANCY_OCID="$({
  awk -v profile="[$OCI_CONFIG_PROFILE]" '
    $0 == profile { in_profile = 1; next }
    /^\[/ { in_profile = 0 }
    in_profile && /^[[:space:]]*tenancy[[:space:]]*=/ {
      sub(/^[^=]*=[[:space:]]*/, "")
      print
      exit
    }
  ' "$OCI_CONFIG_FILE"
})"

if [[ -z "$TENANCY_OCID" ]]; then
  echo "tenancy was not found in $OCI_CONFIG_FILE profile $OCI_CONFIG_PROFILE" >&2
  exit 1
fi

NAMESPACE="$(oci os ns get --profile "$OCI_CONFIG_PROFILE" --query data --raw-output)"
INSTANCE_ID="$(oci compute instance list \
  --profile "$OCI_CONFIG_PROFILE" \
  --compartment-id "$TENANCY_OCID" \
  --display-name "$INSTANCE_NAME" \
  --lifecycle-state RUNNING \
  --query 'data[0].id' \
  --raw-output)"

if [[ -z "$INSTANCE_ID" || "$INSTANCE_ID" == "null" ]]; then
  echo "running instance not found: $INSTANCE_NAME" >&2
  exit 1
fi

INSTANCE_JSON="$(oci compute instance get --profile "$OCI_CONFIG_PROFILE" --instance-id "$INSTANCE_ID" --query data)"
AVAILABILITY_DOMAIN="$(jq -r '."availability-domain"' <<<"$INSTANCE_JSON")"
INSTANCE_IMAGE_OCID="$(jq -r '."image-id"' <<<"$INSTANCE_JSON")"
SSH_AUTHORIZED_KEYS="$(jq -r '.metadata.ssh_authorized_keys' <<<"$INSTANCE_JSON")"
VNIC_ID="$(oci compute vnic-attachment list --profile "$OCI_CONFIG_PROFILE" --compartment-id "$TENANCY_OCID" --instance-id "$INSTANCE_ID" --query 'data[0]."vnic-id"' --raw-output)"
SUBNET_ID="$(oci network vnic get --profile "$OCI_CONFIG_PROFILE" --vnic-id "$VNIC_ID" --query 'data."subnet-id"' --raw-output)"
SUBNET_JSON="$(oci network subnet get --profile "$OCI_CONFIG_PROFILE" --subnet-id "$SUBNET_ID" --query data)"
VCN_ID="$(jq -r '."vcn-id"' <<<"$SUBNET_JSON")"
ROUTE_TABLE_ID="$(jq -r '."route-table-id"' <<<"$SUBNET_JSON")"
SECURITY_LIST_ID="$(jq -r '."security-list-ids"[0]' <<<"$SUBNET_JSON")"
INTERNET_GATEWAY_ID="$(oci network route-table get --profile "$OCI_CONFIG_PROFILE" --rt-id "$ROUTE_TABLE_ID" --query 'data."route-rules"[0]."network-entity-id"' --raw-output)"

if ! oci os bucket get --profile "$OCI_CONFIG_PROFILE" --namespace-name "$NAMESPACE" --bucket-name "$STATE_BUCKET" >/dev/null 2>&1; then
  oci os bucket create \
    --profile "$OCI_CONFIG_PROFILE" \
    --compartment-id "$TENANCY_OCID" \
    --namespace-name "$NAMESPACE" \
    --name "$STATE_BUCKET" \
    --public-access-type NoPublicAccess \
    --storage-tier Standard \
    --versioning Enabled >/dev/null
fi

jq -n \
  --arg tenancy_ocid "$TENANCY_OCID" \
  --arg compartment_ocid "$TENANCY_OCID" \
  --arg availability_domain "$AVAILABILITY_DOMAIN" \
  --arg instance_image_ocid "$INSTANCE_IMAGE_OCID" \
  --arg ssh_authorized_keys "$SSH_AUTHORIZED_KEYS" \
  --arg oci_config_profile "$OCI_CONFIG_PROFILE" \
  --arg region "$REGION" \
  '{
    tenancy_ocid: $tenancy_ocid,
    compartment_ocid: $compartment_ocid,
    availability_domain: $availability_domain,
    instance_image_ocid: $instance_image_ocid,
    ssh_authorized_keys: $ssh_authorized_keys,
    oci_config_profile: $oci_config_profile,
    region: $region
  }' > terraform.auto.tfvars.json

terraform init -reconfigure -upgrade

import_if_missing() {
  local address="$1"
  local id="$2"

  if ! terraform state show "$address" >/dev/null 2>&1; then
    terraform import "$address" "$id"
  fi
}

import_if_missing oci_core_vcn.openlog "$VCN_ID"
import_if_missing oci_core_internet_gateway.openlog "$INTERNET_GATEWAY_ID"
import_if_missing oci_core_route_table.openlog "$ROUTE_TABLE_ID"
import_if_missing oci_core_security_list.openlog "$SECURITY_LIST_ID"
import_if_missing oci_core_subnet.openlog "$SUBNET_ID"
import_if_missing oci_core_instance.openlog "$INSTANCE_ID"
import_if_missing oci_objectstorage_bucket.terraform_state "n/$NAMESPACE/b/$STATE_BUCKET"

terraform plan
