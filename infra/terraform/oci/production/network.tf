resource "oci_core_vcn" "openlog" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "openlog-vcn"
  dns_label      = "vcn07132325"

  lifecycle {
    prevent_destroy = true
  }
}

resource "oci_core_internet_gateway" "openlog" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.openlog.id
  display_name   = "Internet Gateway openlog-vcn"
  enabled        = true

  lifecycle {
    prevent_destroy = true
  }
}

resource "oci_core_route_table" "openlog" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.openlog.id
  display_name   = "Default Route Table for openlog-vcn"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.openlog.id
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "oci_core_security_list" "openlog" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.openlog.id
  display_name   = "Default Security List for openlog-vcn"

  egress_security_rules {
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
    protocol         = "all"
    stateless        = false
  }

  ingress_security_rules {
    description = "SSH administration"
    protocol    = "6"
    source      = var.ssh_allowed_cidr
    source_type = "CIDR_BLOCK"
    stateless   = false

    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    description = "Public HTTP"
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    stateless   = false

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    description = "Public HTTPS"
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    stateless   = false

    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol    = "1"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    stateless   = false

    icmp_options {
      type = 3
      code = 4
    }
  }

  ingress_security_rules {
    protocol    = "1"
    source      = "10.0.0.0/16"
    source_type = "CIDR_BLOCK"
    stateless   = false

    icmp_options {
      type = 3
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "oci_core_subnet" "openlog" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.openlog.id
  cidr_block                 = "10.0.0.0/24"
  display_name               = "openlog-public-subnet"
  dns_label                  = "subnet07140142"
  prohibit_internet_ingress  = false
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.openlog.id
  security_list_ids          = [oci_core_security_list.openlog.id]

  lifecycle {
    prevent_destroy = true
  }
}
