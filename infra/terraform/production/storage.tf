resource "google_storage_bucket" "media" {
  name                        = "openlog_prod"
  location                    = "ASIA"
  storage_class               = "STANDARD"
  public_access_prevention    = "enforced"
  uniform_bucket_level_access = true

  cors {
    max_age_seconds = 3600
    method = [
      "GET",
      "PUT",
      "HEAD",
    ]
    origin = [
      "http://localhost:3030",
      "http://127.0.0.1:3030",
      "https://openlog.kr",
      "https://www.openlog.kr",
    ]
    response_header = [
      "Content-Type",
      "Access-Control-Allow-Origin",
    ]
  }

  soft_delete_policy {
    retention_duration_seconds = 604800
  }

  lifecycle {
    prevent_destroy = true
  }
}
