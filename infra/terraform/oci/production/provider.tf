provider "oci" {
  config_file_profile = var.oci_config_profile
  region              = var.region
}

data "oci_objectstorage_namespace" "openlog" {
  compartment_id = var.tenancy_ocid
}
