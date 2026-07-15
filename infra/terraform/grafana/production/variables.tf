variable "grafana_url" {
  description = "Grafana Cloud stack URL."
  type        = string
}

variable "grafana_service_account_token" {
  description = "Grafana service account token with dashboard, folder, alerting, and data source read permissions."
  type        = string
  sensitive   = true
}

variable "prometheus_data_source_name" {
  description = "Grafana Cloud Prometheus data source name."
  type        = string
  default     = "grafanacloud-gitae9999-prom"
}

variable "loki_data_source_name" {
  description = "Grafana Cloud Loki data source name."
  type        = string
  default     = "grafanacloud-gitae9999-logs"
}

variable "discord_webhook_url" {
  description = "Discord #openlog-alerts incoming webhook URL."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^https://(discord(app)?\\.com)/api/webhooks/", var.discord_webhook_url))
    error_message = "discord_webhook_url must be a Discord webhook URL."
  }
}

variable "synthetic_monitoring_url" {
  description = "Grafana Cloud Synthetic Monitoring API URL for the stack region."
  type        = string
}

variable "synthetic_monitoring_access_token" {
  description = "Grafana Cloud access policy token with Synthetic Monitoring write permissions."
  type        = string
  sensitive   = true
}
