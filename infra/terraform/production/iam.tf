resource "google_service_account" "storage" {
  account_id   = "openlog-storage"
  display_name = "openlog-storage"
  description  = "cloud storage 접근"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_iam_member" "storage_object_admin" {
  project = "openlog-490106"
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.storage.email}"
}

resource "google_storage_bucket_iam_member" "media_object_admin" {
  bucket = google_storage_bucket.media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage.email}"
}
