provider "grafana" {
  url             = var.grafana_url
  auth            = var.grafana_service_account_token
  sm_url          = var.synthetic_monitoring_url
  sm_access_token = var.synthetic_monitoring_access_token
}

data "grafana_data_source" "prometheus" {
  name = var.prometheus_data_source_name
}

data "grafana_data_source" "loki" {
  name = var.loki_data_source_name
}

data "grafana_synthetic_monitoring_probe" "seoul" {
  name = "Seoul"
}

data "grafana_synthetic_monitoring_probe" "singapore" {
  name = "Singapore"
}

resource "grafana_folder" "openlog" {
  title = "OpenLog"
  uid   = "openlog"
}

locals {
  dashboard_source = replace(
    replace(
      file("${path.module}/../../../../deploy/production/monitoring/openlog-operations-dashboard.json"),
      "$${DS_PROMETHEUS}",
      data.grafana_data_source.prometheus.uid,
    ),
    "$${DS_LOKI}",
    data.grafana_data_source.loki.uid,
  )

  dashboard = merge(jsondecode(local.dashboard_source), {
    __inputs = []
  })
}

resource "grafana_dashboard" "openlog_operations" {
  config_json = jsonencode(local.dashboard)
  folder      = grafana_folder.openlog.uid
  overwrite   = true
}

import {
  to = grafana_dashboard.openlog_operations
  id = "openlog-operations"
}

resource "grafana_synthetic_monitoring_check" "web" {
  job     = "openlog-web"
  target  = "https://openlog.kr/"
  enabled = true
  probes = [
    data.grafana_synthetic_monitoring_probe.seoul.id,
    data.grafana_synthetic_monitoring_probe.singapore.id,
  ]

  frequency          = 60000
  timeout            = 10000
  alert_sensitivity  = "none"
  basic_metrics_only = false

  labels = {
    environment = "production"
    service     = "openlog"
    check       = "web"
  }

  settings {
    http {
      method              = "GET"
      fail_if_not_ssl     = true
      no_follow_redirects = false

      tls_config {
        insecure_skip_verify = false
      }
    }
  }
}

resource "grafana_synthetic_monitoring_check" "api_health" {
  job     = "openlog-api-health"
  target  = "https://api.openlog.kr/healthz"
  enabled = true
  probes = [
    data.grafana_synthetic_monitoring_probe.seoul.id,
    data.grafana_synthetic_monitoring_probe.singapore.id,
  ]

  frequency          = 60000
  timeout            = 10000
  alert_sensitivity  = "none"
  basic_metrics_only = false

  labels = {
    environment = "production"
    service     = "openlog"
    check       = "api-health"
  }

  settings {
    http {
      method              = "GET"
      fail_if_not_ssl     = true
      no_follow_redirects = false

      tls_config {
        insecure_skip_verify = false
      }
    }
  }
}

resource "grafana_contact_point" "discord" {
  name = "OpenLog Discord"

  discord {
    url                     = var.discord_webhook_url
    disable_resolve_message = false
  }
}
