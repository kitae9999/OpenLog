output "dashboard_uid" {
  value = grafana_dashboard.openlog_operations.uid
}

output "synthetic_check_ids" {
  value = {
    web        = grafana_synthetic_monitoring_check.web.id
    api_health = grafana_synthetic_monitoring_check.api_health.id
  }
}
