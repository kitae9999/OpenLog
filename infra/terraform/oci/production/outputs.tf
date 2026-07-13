output "instance_id" {
  description = "OCI production instance OCID."
  value       = oci_core_instance.openlog.id
}

output "public_ip" {
  description = "Public IP of the production instance."
  value       = oci_core_instance.openlog.public_ip
}

output "media_bucket" {
  description = "OCI Object Storage bucket used for media."
  value       = oci_objectstorage_bucket.media.name
}

output "object_storage_namespace" {
  description = "OCI Object Storage namespace."
  value       = data.oci_objectstorage_namespace.openlog.namespace
}
