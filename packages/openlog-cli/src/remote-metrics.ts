import type { McpToolObserver } from "./mcp-toolkit.js";

type Outcome = "success" | "failure";
type AuthenticationReason = "none" | "missing_token" | "invalid_token";

type Histogram = {
  count: number;
  sumSeconds: number;
  buckets: number[];
};

type ToolMetric = {
  calls: Record<Outcome, number>;
  duration: Histogram;
};

const HISTOGRAM_BUCKETS_SECONDS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
] as const;

export class RemoteMcpMetrics implements McpToolObserver {
  private readonly requests: Record<Outcome, number> = {
    success: 0,
    failure: 0,
  };
  private readonly requestDuration = createHistogram();
  private readonly responseStatusClasses = new Map<string, number>();
  private requestsInFlight = 0;
  private readonly authentication = new Map<string, number>();
  private readonly introspection = createOutcomeHistograms();
  private readonly tokenExchange = createOutcomeHistograms();
  private readonly tools = new Map<string, ToolMetric>();

  constructor(private readonly enabled = true) {}

  record(
    name: string,
    outcome: Outcome,
    durationMs: number,
  ): void {
    const metric = this.tools.get(name) ?? {
      calls: { success: 0, failure: 0 },
      duration: createHistogram(),
    };
    metric.calls[outcome] += 1;
    observe(metric.duration, durationMs);
    this.tools.set(name, metric);
  }

  beginRequest(): void {
    this.requestsInFlight += 1;
  }

  recordRequest(
    durationMs: number,
    outcome: Outcome,
    statusCode = outcome === "success" ? 200 : 500,
  ): void {
    this.requests[outcome] += 1;
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    this.responseStatusClasses.set(
      statusClass,
      (this.responseStatusClasses.get(statusClass) ?? 0) + 1,
    );
    observe(this.requestDuration, durationMs);
    this.requestsInFlight = Math.max(0, this.requestsInFlight - 1);
  }

  recordAuthentication(
    outcome: Outcome,
    reason: AuthenticationReason,
  ): void {
    const key = `${outcome}:${reason}`;
    this.authentication.set(key, (this.authentication.get(key) ?? 0) + 1);
  }

  recordIntrospection(outcome: Outcome, durationMs: number): void {
    observe(this.introspection[outcome], durationMs);
  }

  recordTokenExchange(outcome: Outcome, durationMs: number): void {
    observe(this.tokenExchange[outcome], durationMs);
  }

  render(): string {
    const lines = [
      "# HELP openlog_mcp_enabled Whether the remote MCP public route is enabled.",
      "# TYPE openlog_mcp_enabled gauge",
      `openlog_mcp_enabled ${this.enabled ? 1 : 0}`,
      "# HELP openlog_mcp_requests_total Total remote MCP HTTP requests by outcome.",
      "# TYPE openlog_mcp_requests_total counter",
      `openlog_mcp_requests_total{outcome="success"} ${this.requests.success}`,
      `openlog_mcp_requests_total{outcome="failure"} ${this.requests.failure}`,
      "# HELP openlog_mcp_responses_total Total remote MCP HTTP responses by status class.",
      "# TYPE openlog_mcp_responses_total counter",
      ...["2xx", "3xx", "4xx", "5xx"].map(
        (statusClass) =>
          `openlog_mcp_responses_total{status_class="${statusClass}"} ${this.responseStatusClasses.get(statusClass) ?? 0}`,
      ),
      "# HELP openlog_mcp_requests_in_flight Remote MCP HTTP requests currently being processed.",
      "# TYPE openlog_mcp_requests_in_flight gauge",
      `openlog_mcp_requests_in_flight ${this.requestsInFlight}`,
    ];
    renderHistogram(
      lines,
      "openlog_mcp_request_duration_seconds",
      "Remote MCP HTTP request latency.",
      this.requestDuration,
    );

    lines.push(
      "# HELP openlog_mcp_authentication_total Remote MCP bearer authentication attempts by outcome and reason.",
      "# TYPE openlog_mcp_authentication_total counter",
    );
    for (const outcome of ["success", "failure"] as const) {
      for (const reason of [
        "none",
        "missing_token",
        "invalid_token",
      ] as const) {
        lines.push(
          `openlog_mcp_authentication_total{outcome="${outcome}",reason="${reason}"} ${this.authentication.get(`${outcome}:${reason}`) ?? 0}`,
        );
      }
    }

    for (const outcome of ["success", "failure"] as const) {
      renderHistogram(
        lines,
        "openlog_mcp_introspection_duration_seconds",
        "Remote MCP token introspection latency by outcome.",
        this.introspection[outcome],
        { outcome },
      );
      renderHistogram(
        lines,
        "openlog_mcp_token_exchange_duration_seconds",
        "Remote MCP internal token exchange latency by outcome.",
        this.tokenExchange[outcome],
        { outcome },
      );
    }

    lines.push(
      "# HELP openlog_mcp_tool_calls_total Remote MCP tool calls by tool and outcome.",
      "# TYPE openlog_mcp_tool_calls_total counter",
    );
    for (const [tool, metric] of [...this.tools.entries()].sort()) {
      const escapedTool = escapeLabelValue(tool);
      lines.push(
        `openlog_mcp_tool_calls_total{tool="${escapedTool}",outcome="success"} ${metric.calls.success}`,
        `openlog_mcp_tool_calls_total{tool="${escapedTool}",outcome="failure"} ${metric.calls.failure}`,
      );
      renderHistogram(
        lines,
        "openlog_mcp_tool_duration_seconds",
        "Remote MCP tool call latency by tool.",
        metric.duration,
        { tool },
      );
    }
    return `${lines.join("\n")}\n`;
  }
}

function createOutcomeHistograms(): Record<Outcome, Histogram> {
  return {
    success: createHistogram(),
    failure: createHistogram(),
  };
}

function createHistogram(): Histogram {
  return {
    count: 0,
    sumSeconds: 0,
    buckets: HISTOGRAM_BUCKETS_SECONDS.map(() => 0),
  };
}

function observe(histogram: Histogram, durationMs: number): void {
  const seconds = Math.max(0, durationMs) / 1000;
  histogram.count += 1;
  histogram.sumSeconds += seconds;
  for (let index = 0; index < HISTOGRAM_BUCKETS_SECONDS.length; index += 1) {
    if (seconds <= HISTOGRAM_BUCKETS_SECONDS[index]) {
      histogram.buckets[index] += 1;
    }
  }
}

function renderHistogram(
  lines: string[],
  name: string,
  help: string,
  histogram: Histogram,
  labels: Record<string, string> = {},
): void {
  if (!lines.includes(`# HELP ${name} ${help}`)) {
    lines.push(`# HELP ${name} ${help}`, `# TYPE ${name} histogram`);
  }
  HISTOGRAM_BUCKETS_SECONDS.forEach((boundary, index) => {
    lines.push(
      `${name}_bucket${renderLabels({ ...labels, le: String(boundary) })} ${histogram.buckets[index]}`,
    );
  });
  lines.push(
    `${name}_bucket${renderLabels({ ...labels, le: "+Inf" })} ${histogram.count}`,
    `${name}_sum${renderLabels(labels)} ${histogram.sumSeconds}`,
    `${name}_count${renderLabels(labels)} ${histogram.count}`,
  );
}

function renderLabels(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return "";
  return `{${entries
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
    .join(",")}}`;
}

function escapeLabelValue(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll('"', '\\"');
}
