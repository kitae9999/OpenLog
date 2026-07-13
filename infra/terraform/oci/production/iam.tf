resource "oci_identity_dynamic_group" "openlog_instance" {
  compartment_id = var.tenancy_ocid
  name           = "openlog-production-instance"
  description    = "OpenLog production VM instance principal"
  matching_rule  = "instance.id = '${oci_core_instance.openlog.id}'"
}

resource "oci_identity_policy" "openlog_media" {
  compartment_id = var.tenancy_ocid
  name           = "openlog-production-media"
  description    = "Allow the OpenLog production VM to manage its private media bucket"
  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.openlog_instance.name} to manage object-family in tenancy where target.bucket.name = '${oci_objectstorage_bucket.media.name}'",
  ]
}
