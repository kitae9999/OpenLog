resource "oci_core_instance" "openlog" {
  availability_domain = var.availability_domain
  compartment_id      = var.compartment_ocid
  display_name        = "openlog-server"
  fault_domain        = "FAULT-DOMAIN-1"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  create_vnic_details {
    assign_public_ip = true
    display_name     = "openlog-server"
    hostname_label   = "openlog-server"
    subnet_id        = oci_core_subnet.openlog.id
  }

  source_details {
    source_id               = var.instance_image_ocid
    source_type             = "image"
    boot_volume_size_in_gbs = 47
    boot_volume_vpus_per_gb = 10
  }

  metadata = {
    ssh_authorized_keys = var.ssh_authorized_keys
  }

  availability_config {
    recovery_action = "RESTORE_INSTANCE"
  }

  instance_options {
    are_legacy_imds_endpoints_disabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
