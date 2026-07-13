variable "tenancy_ocid" {
  description = "OCI tenancy OCID. The current OpenLog resources live in the root compartment."
  type        = string
}

variable "compartment_ocid" {
  description = "Compartment OCID containing the OpenLog production resources."
  type        = string
}

variable "region" {
  description = "OCI region identifier."
  type        = string
  default     = "ap-tokyo-1"
}

variable "oci_config_profile" {
  description = "Profile in ~/.oci/config used by the OCI provider."
  type        = string
  default     = "DEFAULT"
}

variable "availability_domain" {
  description = "Availability domain containing the existing production instance."
  type        = string
}

variable "instance_image_ocid" {
  description = "Boot image OCID used by the existing production instance."
  type        = string
}

variable "ssh_authorized_keys" {
  description = "Public SSH keys stored in the existing instance metadata."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to reach SSH. Replace the default with a stable administrator IP when possible."
  type        = string
  default     = "0.0.0.0/0"
}

variable "instance_ocpus" {
  description = "OCPUs assigned to the Ampere A1 instance."
  type        = number
  default     = 4
}

variable "instance_memory_gb" {
  description = "Memory assigned to the Ampere A1 instance."
  type        = number
  default     = 24
}
