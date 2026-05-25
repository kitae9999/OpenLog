resource "google_compute_instance" "app" {
  name         = "instance-20260423-083246"
  machine_type = "e2-standard-2"
  zone         = "asia-northeast3-a"

  tags = [
    "http-server",
    "https-server",
  ]

  labels = {
    "goog-ops-agent-policy" = "v2-template-1-7-0"
  }

  metadata = {
    "enable-osconfig" = "TRUE"
  }

  boot_disk {
    auto_delete = true
    device_name = "instance-20260423-083246"
    mode        = "READ_WRITE"
    source      = "https://www.googleapis.com/compute/v1/projects/openlog-490106/zones/asia-northeast3-a/disks/instance-20260423-083246"
  }

  network_interface {
    network    = "https://www.googleapis.com/compute/v1/projects/openlog-490106/global/networks/default"
    subnetwork = "https://www.googleapis.com/compute/v1/projects/openlog-490106/regions/asia-northeast3/subnetworks/default"

    access_config {
      network_tier = "PREMIUM"
    }
  }

  service_account {
    email = google_service_account.storage.email
    scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
    preemptible         = false
    provisioning_model  = "STANDARD"
  }

  shielded_instance_config {
    enable_integrity_monitoring = true
    enable_secure_boot          = false
    enable_vtpm                 = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
