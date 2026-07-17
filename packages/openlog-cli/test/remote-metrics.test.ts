import assert from "node:assert/strict";
import test from "node:test";
import { RemoteMcpMetrics } from "../src/remote-metrics.js";

test("renders bounded Prometheus metrics without tenant labels", () => {
  const metrics = new RemoteMcpMetrics();
  metrics.beginRequest();
  metrics.recordAuthentication("success", "none");
  metrics.recordIntrospection("success", 40);
  metrics.recordTokenExchange("failure", 80);
  metrics.record("start_openlog_session", "success", 120);
  metrics.recordRequest(200, "success");

  const rendered = metrics.render();

  assert.match(rendered, /openlog_mcp_enabled 1/);
  assert.match(
    rendered,
    /openlog_mcp_requests_total\{outcome="success"} 1/,
  );
  assert.match(rendered, /openlog_mcp_requests_in_flight 0/);
  assert.match(
    rendered,
    /openlog_mcp_request_duration_seconds_bucket\{le="0.25"} 1/,
  );
  assert.match(
    rendered,
    /openlog_mcp_token_exchange_duration_seconds_count\{outcome="failure"} 1/,
  );
  assert.match(
    rendered,
    /openlog_mcp_tool_calls_total\{tool="start_openlog_session",outcome="success"} 1/,
  );
  assert.doesNotMatch(
    rendered,
    /\{[^}\n]*(user_id|connection_id|project_id|access_token)=/,
  );
});
