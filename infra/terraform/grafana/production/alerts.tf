locals {
  user_api_matchers = "job=\"openlog-backend\",uri!~\"/actuator.*\",uri!=\"/workspaces/{workspaceId}/events\""

  alert_rules = {
    external_web_down = {
      name           = "OpenLog web external check failed"
      expr           = "max(probe_success{job=\"openlog-web\"})"
      evaluator_type = "lt"
      threshold      = 1
      pending_period = "2m"
      no_data_state  = "Alerting"
      severity       = "critical"
      summary        = "OpenLog web is unreachable from every configured public probe."
    }
    external_api_down = {
      name           = "OpenLog API external check failed"
      expr           = "max(probe_success{job=\"openlog-api-health\"})"
      evaluator_type = "lt"
      threshold      = 1
      pending_period = "2m"
      no_data_state  = "Alerting"
      severity       = "critical"
      summary        = "OpenLog API health endpoint is unreachable from every configured public probe."
    }
    spring_metrics_missing = {
      name           = "OpenLog Spring metrics missing"
      expr           = "max((max_over_time(up{job=\"openlog-backend\"}[3m]) < bool 1) or absent_over_time(up{job=\"openlog-backend\"}[3m]))"
      evaluator_type = "gt"
      threshold      = 0
      pending_period = "0s"
      no_data_state  = "Alerting"
      severity       = "critical"
      summary        = "Alloy cannot scrape the Spring Actuator Prometheus endpoint."
    }
    disk_critical = {
      name           = "OpenLog root disk usage critical"
      expr           = "100 * max(1 - (node_filesystem_avail_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"}))"
      evaluator_type = "gt"
      threshold      = 90
      pending_period = "5m"
      no_data_state  = "OK"
      severity       = "critical"
      summary        = "Root disk usage has exceeded 90% for five minutes."
    }
    tls_expiring = {
      name           = "OpenLog TLS certificate expires soon"
      expr           = "min((probe_ssl_earliest_cert_expiry{job=~\"openlog-web|openlog-api-health\"} - time()) / 86400)"
      evaluator_type = "lt"
      threshold      = 14
      pending_period = "0s"
      no_data_state  = "OK"
      severity       = "warning"
      summary        = "An OpenLog TLS certificate expires in fewer than 14 days."
    }
    disk_warning = {
      name           = "OpenLog root disk usage warning"
      expr           = "100 * max(1 - (node_filesystem_avail_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"}))"
      evaluator_type = "gt"
      threshold      = 85
      pending_period = "15m"
      no_data_state  = "OK"
      severity       = "warning"
      summary        = "Root disk usage has exceeded 85% for 15 minutes."
    }
    memory_warning = {
      name           = "OpenLog available memory low"
      expr           = "100 * min(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)"
      evaluator_type = "lt"
      threshold      = 10
      pending_period = "15m"
      no_data_state  = "OK"
      severity       = "warning"
      summary        = "Available host memory has remained below 10% for 15 minutes."
    }
    cpu_warning = {
      name           = "OpenLog CPU usage high"
      expr           = "100 * max(1 - avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])))"
      evaluator_type = "gt"
      threshold      = 90
      pending_period = "15m"
      no_data_state  = "OK"
      severity       = "warning"
      summary        = "Host CPU usage has remained above 90% for 15 minutes."
    }
    container_restart = {
      name           = "OpenLog container restarted"
      expr           = "max(changes((max by (compose_service) (container_start_time_seconds{compose_service!=\"\"}))[10m:1m]))"
      evaluator_type = "gt"
      threshold      = 0
      pending_period = "0s"
      no_data_state  = "OK"
      severity       = "warning"
      summary        = "A Docker Compose service start time changed during the last 10 minutes."
    }
    user_api_5xx = {
      name           = "OpenLog user API error rate high"
      expr           = <<-EOT
        max(
          (sum(increase(http_server_requests_seconds_count{${local.user_api_matchers},status=~"5.."}[5m])) >= bool 3)
          or
          (
            (sum(increase(http_server_requests_seconds_count{${local.user_api_matchers}}[5m])) >= bool 20)
            *
            (
              sum(increase(http_server_requests_seconds_count{${local.user_api_matchers},status=~"5.."}[5m]))
              /
              clamp_min(sum(increase(http_server_requests_seconds_count{${local.user_api_matchers}}[5m])), 1)
              > bool 0.05
            )
          )
        )
      EOT
      evaluator_type = "gt"
      threshold      = 0
      pending_period = "0s"
      no_data_state  = "OK"
      severity       = "warning"
      summary        = "The user API produced at least three 5xx responses or exceeded a 5% error rate."
    }
    user_api_p95 = {
      name           = "OpenLog user API p95 latency high"
      expr           = <<-EOT
        histogram_quantile(
          0.95,
          sum by (le) (rate(http_server_requests_seconds_bucket{${local.user_api_matchers}}[5m]))
        )
        *
        (sum(increase(http_server_requests_seconds_count{${local.user_api_matchers}}[5m])) >= bool 20)
      EOT
      evaluator_type = "gt"
      threshold      = 1
      pending_period = "10m"
      no_data_state  = "OK"
      severity       = "warning"
      summary        = "The user API p95 latency exceeded one second with at least 20 requests."
    }
  }
}

resource "grafana_rule_group" "openlog" {
  name             = "OpenLog production alerts"
  folder_uid       = grafana_folder.openlog.uid
  interval_seconds = 60

  dynamic "rule" {
    for_each = local.alert_rules

    content {
      name           = rule.value.name
      condition      = "B"
      for            = rule.value.pending_period
      no_data_state  = rule.value.no_data_state
      exec_err_state = "Error"

      annotations = {
        summary = rule.value.summary
      }

      labels = {
        environment = "production"
        service     = "openlog"
        severity    = rule.value.severity
      }

      data {
        ref_id = "A"

        relative_time_range {
          from = 600
          to   = 0
        }

        datasource_uid = data.grafana_data_source.prometheus.uid
        model = jsonencode({
          datasource = {
            type = "prometheus"
            uid  = data.grafana_data_source.prometheus.uid
          }
          editorMode    = "code"
          expr          = trimspace(rule.value.expr)
          instant       = true
          intervalMs    = 1000
          legendFormat  = "__auto"
          maxDataPoints = 43200
          range         = false
          refId         = "A"
        })
      }

      data {
        ref_id         = "B"
        datasource_uid = "-100"

        relative_time_range {
          from = 0
          to   = 0
        }

        model = jsonencode({
          conditions = [
            {
              evaluator = {
                params = [rule.value.threshold]
                type   = rule.value.evaluator_type
              }
              operator = {
                type = "and"
              }
              query = {
                params = ["A"]
              }
              reducer = {
                params = []
                type   = "last"
              }
              type = "query"
            },
          ]
          datasource = {
            type = "__expr__"
            uid  = "-100"
          }
          expression    = "A"
          intervalMs    = 1000
          maxDataPoints = 43200
          refId         = "B"
          type          = "classic_conditions"
        })
      }

      notification_settings {
        contact_point   = grafana_contact_point.discord.name
        group_by        = ["alertname", "grafana_folder", "service", "environment", "severity"]
        group_wait      = "30s"
        group_interval  = "5m"
        repeat_interval = "4h"
      }
    }
  }
}
