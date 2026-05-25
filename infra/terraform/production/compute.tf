resource "google_compute_instance" "app" {
  name         = "instance-20260423-083246"
  machine_type = "e2-standard-2"
  zone         = "asia-northeast3-a"
}