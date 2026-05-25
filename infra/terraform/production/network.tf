resource "google_compute_firewall" "allow_http_https" {
  name    = "openlog-allow-http-https"
  network = "default"

  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server", "https-server"]
}