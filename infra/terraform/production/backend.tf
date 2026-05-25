terraform {
  backend "gcs" {
    bucket = "openlog-490106-terraform-state"
    prefix = "openlog/production"
  }
}
