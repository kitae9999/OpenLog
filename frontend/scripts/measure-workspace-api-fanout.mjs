import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import process from "node:process";
import { chromium } from "@playwright/test";

const appPort = 3140;
const apiPort = 3141;
const appUrl = `http://127.0.0.1:${appPort}`;
const apiUrl = `http://127.0.0.1:${apiPort}`;
const clientCount = 5;

const counts = new Map();
const responseBytes = new Map();
const openStreams = new Set();
const dashboardTodos = [];
const now = new Date().toISOString();
const dashboardTasks = [
  {
    id: 1,
    title: "Initial task",
    description: "Task used by the workspace refresh benchmark.",
    content: "## Benchmark task",
    status: "DOING",
    createdAt: now,
    updatedAt: now,
  },
];
const dashboardLogs = [
  {
    id: 1,
    kind: "NOTE",
    status: "NONE",
    title: "Initial log",
    summary: "Log used by the workspace refresh benchmark.",
    content: "## Benchmark log",
    taskId: 1,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
  },
];
const dashboardOutputs = [
  {
    id: 1,
    status: "DRAFT",
    title: "Initial output",
    taskCount: 1,
    logCount: 1,
    taskIds: [1],
    logIds: [1],
    updatedAt: now,
    exportedAt: null,
  },
];
const dashboardMemories = [
  {
    id: 1,
    title: "Initial memory",
    content: "Memory used by the workspace refresh benchmark.",
    excerpt: "Memory used by the workspace refresh benchmark.",
    task: { id: 1, title: "Initial task" },
    originLog: { id: 1, title: "Initial log" },
    createdAt: now,
    updatedAt: now,
  },
];
let dashboardWorkingBrief = {
  title: "Initial brief",
  prose: "Working brief used by the workspace refresh benchmark.",
  taskId: 1,
  taskTitle: "Initial task",
  branch: "benchmark/dashboard-refresh",
  updatedAt: now,
};
const bootstrapResponse = {
  user: {
    id: 1,
    username: "fanout-test",
    nickname: "Fanout Test",
    email: "fanout@example.test",
    profileImageUrl: null,
    bio: null,
    isOnboardingComplete: true,
  },
  workspaces: [
    {
      id: 1,
      slug: "fanout-test",
      name: "Fanout Test",
      projects: [
        {
          id: 1,
          workspaceId: 1,
          displayName: "fanout/test",
          repositoryFullName: "fanout/test",
          captureMode: "AUTO",
          createdAt: "2026-07-20T00:00:00",
          updatedAt: "2026-07-20T00:00:00",
        },
      ],
    },
  ],
  activeWorkspaceId: 1,
  navigationSummary: {
    activeTaskCount: 0,
    logsCount: 0,
    openIssuesCount: 0,
  },
  notificationSummary: { unreadCount: 0 },
};

function record(pathname) {
  counts.set(pathname, (counts.get(pathname) ?? 0) + 1);
}

function toLogSummary(log) {
  return {
    id: log.id,
    kind: log.kind,
    status: log.status,
    title: log.title,
    summary: log.summary,
    taskId: log.taskId,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

function json(response, status, value) {
  const body = JSON.stringify(value);
  const pathname = response.requestPathname ?? "unknown";
  responseBytes.set(
    pathname,
    (responseBytes.get(pathname) ?? 0) + Buffer.byteLength(body),
  );
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(body);
}

const mockApi = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", apiUrl);
  response.requestPathname = url.pathname;
  record(url.pathname);

  if (url.pathname === "/app/bootstrap") {
    json(response, 200, bootstrapResponse);
    return;
  }

  if (url.pathname === "/auth/me") {
    json(response, 200, {
      id: 1,
      username: "fanout-test",
      nickname: "Fanout Test",
      email: "fanout@example.test",
      profileImageUrl: null,
      bio: null,
      isOnboardingComplete: true,
    });
    return;
  }

  if (url.pathname === "/workspaces") {
    json(response, 200, [
      {
        id: 1,
        slug: "fanout-test",
        name: "Fanout Test",
        projects: [
          {
            id: 1,
            workspaceId: 1,
            displayName: "fanout/test",
            repositoryFullName: "fanout/test",
            captureMode: "AUTO",
            createdAt: "2026-07-20T00:00:00",
            updatedAt: "2026-07-20T00:00:00",
          },
        ],
      },
    ]);
    return;
  }

  if (url.pathname === "/workspaces/1/tasks") {
    json(response, 200, {
      tasks: dashboardTasks,
      nextCursor: null,
      hasNext: false,
    });
    return;
  }

  if (url.pathname.startsWith("/workspaces/1/tasks/")) {
    const taskId = Number(url.pathname.split("/").at(-1));
    const task = dashboardTasks.find((item) => item.id === taskId);
    json(response, task ? 200 : 404, task ?? { code: "NOT_FOUND" });
    return;
  }

  if (url.pathname === "/workspaces/1/dashboard") {
    json(response, 200, {
      tasks: dashboardTasks.slice(0, 20),
      logs: dashboardLogs.slice(0, 6).map(toLogSummary),
      taskLinks: [],
      logLinks: [],
      crossLinks: [],
      todos: dashboardTodos,
      outputs: dashboardOutputs.slice(0, 1),
      memories: dashboardMemories.slice(0, 8),
      workingBrief: dashboardWorkingBrief,
      activity: {
        from: url.searchParams.get("from"),
        to: url.searchParams.get("to"),
        totalLogCount: 0,
        days: [],
      },
      navigationSummary: {
        activeTaskCount: 0,
        logsCount: 0,
        openIssuesCount: 0,
      },
    });
    return;
  }

  if (url.pathname === "/workspaces/1/dashboard/refresh") {
    const zone = url.searchParams.get("zone");
    const entityIds = url.searchParams
      .getAll("entityIds")
      .map(Number)
      .filter(Number.isFinite);
    const mode = entityIds.length === 1 ? "PATCH" : "REPLACE";
    const navigationSummary = {
      activeTaskCount: 0,
      logsCount: dashboardLogs.length,
      openIssuesCount: 0,
    };

    if (zone === "TASKS") {
      const task =
        mode === "PATCH"
          ? dashboardTasks.find((item) => item.id === entityIds[0])
          : null;
      if (mode === "PATCH" && !task) {
        json(response, 404, { code: "NOT_FOUND" });
        return;
      }
      json(response, 200, {
        zone,
        mode,
        task,
        tasks: mode === "REPLACE" ? dashboardTasks.slice(0, 20) : [],
        log: null,
        logs: [],
        linkedTask: null,
        navigationSummary,
        activity: null,
      });
      return;
    }

    if (zone === "LOGS") {
      const log =
        mode === "PATCH"
          ? dashboardLogs.find((item) => item.id === entityIds[0])
          : null;
      if (mode === "PATCH" && !log) {
        json(response, 404, { code: "NOT_FOUND" });
        return;
      }
      const linkedTask =
        log?.taskId === null || log?.taskId === undefined
          ? null
          : dashboardTasks.find((item) => item.id === log.taskId) ?? null;
      json(response, 200, {
        zone,
        mode,
        task: null,
        tasks:
          mode === "REPLACE"
            ? dashboardTasks.slice(0, 20)
            : [],
        log,
        logs:
          mode === "REPLACE"
            ? dashboardLogs.slice(0, 20).map(toLogSummary)
            : [],
        linkedTask,
        navigationSummary,
        activity: {
          from: url.searchParams.get("from"),
          to: url.searchParams.get("to"),
          totalLogCount: dashboardLogs.length,
          days: [],
        },
      });
      return;
    }

    json(response, 400, { code: "BAD_ZONE" });
    return;
  }

  if (url.pathname === "/workspaces/1/navigation-summary") {
    json(response, 200, {
      activeTaskCount: 0,
      logsCount: 0,
      openIssuesCount: 0,
    });
    return;
  }

  if (url.pathname === "/workspaces/1/graph-view") {
    json(response, 200, {
      tasks: dashboardTasks,
      logs: dashboardLogs.map(toLogSummary),
      outputs: dashboardOutputs,
      memories: dashboardMemories,
      taskLinks: [],
      logLinks: [],
      crossLinks: [],
    });
    return;
  }

  if (url.pathname === "/workspaces/1/logs") {
    json(response, 200, {
      logs: dashboardLogs.map(toLogSummary),
      nextCursor: null,
      hasNext: false,
    });
    return;
  }

  if (url.pathname.startsWith("/workspaces/1/logs/")) {
    const logId = Number(url.pathname.split("/").at(-1));
    const log = dashboardLogs.find((item) => item.id === logId);
    json(response, log ? 200 : 404, log ?? { code: "NOT_FOUND" });
    return;
  }

  if (url.pathname === "/workspaces/1/memories") {
    json(response, 200, {
      memories: dashboardMemories,
      nextCursor: null,
      hasNext: false,
    });
    return;
  }

  if (url.pathname.startsWith("/workspaces/1/memories/")) {
    const memoryId = Number(url.pathname.split("/").at(-1));
    const memory = dashboardMemories.find((item) => item.id === memoryId);
    json(response, memory ? 200 : 404, memory ?? { code: "NOT_FOUND" });
    return;
  }

  if (url.pathname === "/workspaces/1/working-brief") {
    json(
      response,
      dashboardWorkingBrief ? 200 : 404,
      dashboardWorkingBrief ?? { code: "NOT_FOUND" },
    );
    return;
  }

  if (url.pathname === "/workspaces/1/activity") {
    json(response, 200, {
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      totalLogCount: 0,
      days: [],
    });
    return;
  }

  if (url.pathname === "/workspaces/1/events") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.write("event: workspace.subscribed\n");
    response.write('data: {"workspaceId":1}\n\n');
    openStreams.add(response);
    response.on("close", () => openStreams.delete(response));
    return;
  }

  if (url.pathname === "/workspaces/1/todos" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const input = JSON.parse(body || "{}");
      const todo = {
        id: dashboardTodos.length + 1,
        title: input.title,
        done: false,
        taskId: input.taskId ?? null,
        plannedFor: input.plannedFor,
      };
      dashboardTodos.push(todo);
      json(response, 200, todo);
    });
    return;
  }

  if (url.pathname === "/workspaces/1/todos") {
    json(response, 200, dashboardTodos);
    return;
  }

  if (url.pathname === "/workspaces/1/outputs") {
    json(response, 200, dashboardOutputs);
    return;
  }

  if (url.pathname.startsWith("/workspaces/1/outputs/")) {
    const outputId = Number(url.pathname.split("/").at(-1));
    const output = dashboardOutputs.find((item) => item.id === outputId);
    json(
      response,
      output ? 200 : 404,
      output
        ? {
            ...output,
            content: "## Benchmark output",
            tasks: dashboardTasks
              .filter((task) => output.taskIds.includes(task.id))
              .map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status,
              })),
            logs: dashboardLogs
              .filter((log) => output.logIds.includes(log.id))
              .map((log) => ({
                id: log.id,
                title: log.title,
                kind: log.kind,
                status: log.status,
                taskId: log.taskId,
              })),
            linkedPost: null,
          }
        : { code: "NOT_FOUND" },
    );
    return;
  }

  if (url.pathname === "/notifications") {
    json(response, 200, { notifications: [], unreadCount: 0 });
    return;
  }

  if (url.pathname === "/notifications/summary") {
    json(response, 200, { unreadCount: 0 });
    return;
  }

  if (url.pathname === "/users/me/posts") {
    json(response, 200, {
      posts: [],
      size: 10,
      nextCursor: null,
      hasNext: false,
    });
    return;
  }

  if (
    url.pathname === "/workspaces/1/task-links" ||
    url.pathname === "/workspaces/1/log-links" ||
    url.pathname === "/workspaces/1/cross-links"
  ) {
    json(response, 200, []);
    return;
  }

  json(response, 404, { code: "NOT_FOUND", path: url.pathname });
});

await new Promise((resolve) => mockApi.listen(apiPort, "127.0.0.1", resolve));

const build = spawnSync("pnpm", ["build"], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: apiUrl },
  stdio: "inherit",
});

if (build.status !== 0) {
  mockApi.close();
  process.exit(build.status ?? 1);
}

const app = spawn("pnpm", ["exec", "next", "start", "-p", String(appPort)], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: apiUrl },
  stdio: ["ignore", "pipe", "pipe"],
});

app.stdout.on("data", (chunk) => process.stdout.write(chunk));
app.stderr.on("data", (chunk) => process.stderr.write(chunk));

async function waitForApp() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${appUrl}/robots.txt`);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the Next.js production server.");
}

let browser;
try {
  await waitForApp();
  browser = await chromium.launch({ headless: true });

  await measureScenario({
    browser,
    path: "/dashboard",
    label: "workspace",
    maxRequestCount: 15,
    heading: "Fanout Test",
  });
  await measureScenario({
    browser,
    path: "/?tab=home",
    label: "home feed",
    maxRequestCount: 30,
    forbiddenPaths: ["/workspaces/1/tasks", "/workspaces/1/logs"],
  });
  await measureDashboardRefreshUseCases(browser);
  await measureRapidSidebarNavigation(browser);
} finally {
  await browser?.close();
  for (const stream of openStreams) stream.end();
  app.kill("SIGTERM");
  mockApi.close();
}

async function measureDashboardRefreshUseCases(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${appUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Fanout Test" }).waitFor();
  await page.waitForTimeout(500);
  await waitForOpenStreamCount(1);

  clearMetrics();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Fanout Test" }).waitFor();
  await page.waitForTimeout(500);
  await waitForOpenStreamCount(1);
  printAndAssertCounts("manual dashboard reload", {
    maxRequestCount: 3,
    required: {
      "/app/bootstrap": 1,
      "/workspaces/1/dashboard": 1,
      "/workspaces/1/events": 1,
    },
    forbidden: ["/auth/me", "/workspaces", "/notifications"],
  });

  clearMetrics();
  const todoTitle = "Optimistic dashboard todo";
  await page.getByLabel("New todo").fill(todoTitle);
  await page.getByLabel("New todo").press("Enter");
  await page.getByText(todoTitle, { exact: true }).waitFor();
  await page.waitForTimeout(300);
  printAndAssertCounts("dashboard todo mutation", {
    maxRequestCount: 1,
    required: { "/workspaces/1/todos": 1 },
    forbidden: ["/workspaces", "/workspaces/1/dashboard"],
  });

  clearMetrics();
  const externalTitle = "External SSE dashboard todo";
  dashboardTodos.push({
    id: dashboardTodos.length + 1,
    title: externalTitle,
    done: false,
    taskId: null,
    plannedFor: new Date().toISOString().slice(0, 10),
  });
  broadcastWorkspaceChange({
    zone: "todos",
    entityType: "TODO",
    entityId: String(dashboardTodos.length),
    action: "CREATED",
  });
  await page.getByText(externalTitle, { exact: true }).waitFor();
  await waitForRequestCount("/workspaces/1/todos", 1);
  const singleTodoMetrics = printAndAssertCounts(
    "single-zone SSE todo refresh",
    {
    maxRequestCount: 1,
      required: { "/workspaces/1/todos": 1 },
      forbidden: [
        "/auth/me",
        "/workspaces",
        "/notifications",
        "/workspaces/1/dashboard",
      ],
    },
  );

  clearMetrics();
  dashboardTasks[0] = {
    ...dashboardTasks[0],
    title: "Task updated through SSE",
    updatedAt: new Date(Date.now() + 1_000).toISOString(),
  };
  broadcastWorkspaceChange({
    zone: "tasks",
    entityType: "TASK",
    entityId: "1",
    action: "UPDATED",
  });
  await page.getByText("Task updated through SSE", { exact: true }).waitFor();
  await waitForRequestCount("/workspaces/1/dashboard/refresh", 1);
  const singleTaskMetrics = printAndAssertCounts(
    "single-entity SSE task refresh",
    {
      maxRequestCount: 1,
      required: { "/workspaces/1/dashboard/refresh": 1 },
      forbidden: [
        "/workspaces/1/dashboard",
        "/workspaces/1/tasks",
        "/workspaces/1/tasks/1",
        "/workspaces/1/navigation-summary",
        "/workspaces/1/graph-view",
        "/workspaces/1/planner-view",
      ],
    },
  );

  clearMetrics();
  dashboardLogs[0] = {
    ...dashboardLogs[0],
    title: "Log updated through SSE",
    updatedAt: new Date(Date.now() + 2_000).toISOString(),
  };
  dashboardTasks[0] = {
    ...dashboardTasks[0],
    updatedAt: new Date(Date.now() + 2_000).toISOString(),
  };
  broadcastWorkspaceChange({
    zone: "logs",
    entityType: "LOG",
    entityId: "1",
    action: "UPDATED",
  });
  await page.getByText("Log updated through SSE", { exact: true }).waitFor();
  await waitForRequestCount("/workspaces/1/dashboard/refresh", 1);
  const singleLogMetrics = printAndAssertCounts(
    "single-entity SSE log refresh",
    {
      maxRequestCount: 1,
      required: { "/workspaces/1/dashboard/refresh": 1 },
      forbidden: [
        "/workspaces/1/dashboard",
        "/workspaces/1/logs",
        "/workspaces/1/logs/1",
        "/workspaces/1/tasks/1",
        "/workspaces/1/navigation-summary",
        "/workspaces/1/activity",
        "/workspaces/1/graph-view",
      ],
    },
  );

  clearMetrics();
  dashboardOutputs[0] = {
    ...dashboardOutputs[0],
    title: "Output updated through SSE",
    updatedAt: new Date(Date.now() + 3_000).toISOString(),
  };
  broadcastWorkspaceChange({
    zone: "output",
    entityType: "OUTPUT",
    entityId: "1",
    action: "UPDATED",
  });
  await waitForRequestCount("/workspaces/1/outputs/1", 1);
  printAndAssertCounts("single-entity SSE output refresh", {
    maxRequestCount: 1,
    required: { "/workspaces/1/outputs/1": 1 },
    forbidden: ["/workspaces/1/dashboard", "/workspaces/1/outputs"],
  });

  clearMetrics();
  dashboardMemories[0] = {
    ...dashboardMemories[0],
    title: "Memory updated through SSE",
    updatedAt: new Date(Date.now() + 4_000).toISOString(),
  };
  broadcastWorkspaceChange({
    zone: "memory",
    entityType: "MEMORY",
    entityId: "1",
    action: "UPDATED",
  });
  await waitForRequestCount("/workspaces/1/memories/1", 1);
  printAndAssertCounts("single-entity SSE memory refresh", {
    maxRequestCount: 1,
    required: { "/workspaces/1/memories/1": 1 },
    forbidden: ["/workspaces/1/dashboard", "/workspaces/1/memories"],
  });

  clearMetrics();
  dashboardWorkingBrief = {
    ...dashboardWorkingBrief,
    title: "Brief updated through SSE",
    updatedAt: new Date(Date.now() + 5_000).toISOString(),
  };
  broadcastWorkspaceChange({
    zone: "brief",
    entityType: "BRIEF",
    entityId: "1",
    action: "UPDATED",
  });
  await waitForRequestCount("/workspaces/1/working-brief", 1);
  printAndAssertCounts("single-zone SSE working brief refresh", {
    maxRequestCount: 1,
    required: { "/workspaces/1/working-brief": 1 },
    forbidden: ["/workspaces/1/dashboard"],
  });

  clearMetrics();
  dashboardTasks.push(
    {
      id: 2,
      title: "Burst task two",
      description: null,
      content: null,
      status: "TODO",
      createdAt: now,
      updatedAt: new Date(Date.now() + 6_000).toISOString(),
    },
    {
      id: 3,
      title: "Burst task three",
      description: null,
      content: null,
      status: "TODO",
      createdAt: now,
      updatedAt: new Date(Date.now() + 7_000).toISOString(),
    },
  );
  broadcastWorkspaceChange({
    zone: "tasks",
    entityType: "TASK",
    entityId: "2",
    action: "CREATED",
  });
  broadcastWorkspaceChange({
    zone: "tasks",
    entityType: "TASK",
    entityId: "3",
    action: "CREATED",
  });
  await page.getByText("Burst task three", { exact: true }).waitFor();
  await waitForRequestCount("/workspaces/1/dashboard/refresh", 1);
  const taskBurstMetrics = printAndAssertCounts(
    "same-zone SSE task burst",
    {
      maxRequestCount: 1,
      required: { "/workspaces/1/dashboard/refresh": 1 },
      forbidden: [
        "/workspaces/1/dashboard",
        "/workspaces/1/tasks",
        "/workspaces/1/tasks/2",
        "/workspaces/1/tasks/3",
        "/workspaces/1/navigation-summary",
      ],
    },
  );

  clearMetrics();
  const multiZoneTodoTitle = "Multi-zone recovery todo";
  dashboardTodos.push({
    id: dashboardTodos.length + 1,
    title: multiZoneTodoTitle,
    done: false,
    taskId: null,
    plannedFor: new Date().toISOString().slice(0, 10),
  });
  dashboardTasks[0] = {
    ...dashboardTasks[0],
    title: "Multi-zone recovery task",
    updatedAt: new Date(Date.now() + 8_000).toISOString(),
  };
  broadcastWorkspaceChange({
    zone: "tasks",
    entityType: "TASK",
    entityId: "1",
    action: "UPDATED",
  });
  broadcastWorkspaceChange({
    zone: "todos",
    entityType: "TODO",
    entityId: String(dashboardTodos.length),
    action: "CREATED",
  });
  await page.getByText(multiZoneTodoTitle, { exact: true }).waitFor();
  await waitForRequestCount("/workspaces/1/dashboard", 1);
  const multiZoneMetrics = printAndAssertCounts(
    "multi-zone SSE snapshot recovery",
    {
      maxRequestCount: 1,
      required: { "/workspaces/1/dashboard": 1 },
      forbidden: [
        "/workspaces/1/tasks",
        "/workspaces/1/tasks/1",
        "/workspaces/1/todos",
      ],
    },
  );
  for (const [label, metrics] of [
    ["Todo", singleTodoMetrics],
    ["Task", singleTaskMetrics],
    ["Log", singleLogMetrics],
    ["Task burst", taskBurstMetrics],
  ]) {
    const payloadReduction = Math.round(
      (1 - metrics.totalBytes / multiZoneMetrics.totalBytes) * 100,
    );
    console.log(
      `${label} refresh response bytes were ${payloadReduction}% smaller than the dashboard snapshot fixture.`,
    );
  }

  clearMetrics();
  dashboardTasks.splice(
    dashboardTasks.findIndex((task) => task.id === 2),
    1,
  );
  broadcastWorkspaceChange({
    zone: "tasks",
    entityType: "TASK",
    entityId: "2",
    action: "DELETED",
  });
  await waitForRequestCount("/workspaces/1/dashboard", 1);
  printAndAssertCounts("cascading task delete snapshot recovery", {
    maxRequestCount: 1,
    required: { "/workspaces/1/dashboard": 1 },
    forbidden: ["/workspaces/1/tasks", "/workspaces/1/tasks/2"],
  });

  clearMetrics();
  broadcastWorkspaceChange({
    zone: "tasks",
    entityType: "TASK",
    entityId: "999",
    action: "UPDATED",
  });
  await waitForRequestCount("/workspaces/1/dashboard", 1);
  printAndAssertCounts("missing entity snapshot recovery", {
    maxRequestCount: 2,
    required: {
      "/workspaces/1/dashboard/refresh": 1,
      "/workspaces/1/dashboard": 1,
    },
    forbidden: [
      "/workspaces/1/tasks/999",
      "/workspaces/1/navigation-summary",
    ],
  });

  clearMetrics();
  broadcastWorkspaceChange({
    zone: "unknown",
    entityType: "UNKNOWN",
    entityId: "1",
    action: "UPDATED",
  });
  await waitForRequestCount("/workspaces/1/dashboard", 1);
  printAndAssertCounts("unknown-zone snapshot recovery", {
    maxRequestCount: 1,
    required: { "/workspaces/1/dashboard": 1 },
  });

  await page.clock.install();
  await setDocumentVisibility(page, "hidden");
  await page.clock.fastForward(59_000);
  assertOpenStreamCount(1, "hidden SSE grace period");
  await page.clock.fastForward(1_000);
  await waitForOpenStreamCount(0);

  clearMetrics();
  await setDocumentVisibility(page, "visible");
  await waitForOpenStreamCount(1);
  await waitForRequestCount("/workspaces/1/dashboard", 1);
  printAndAssertCounts("visible SSE reconnect snapshot recovery", {
    maxRequestCount: 2,
    required: {
      "/workspaces/1/events": 1,
      "/workspaces/1/dashboard": 1,
    },
    forbidden: ["/auth/me", "/workspaces", "/notifications"],
  });

  clearMetrics();
  const resumedTitle = "Visible reconnect dashboard todo";
  dashboardTodos.push({
    id: dashboardTodos.length + 1,
    title: resumedTitle,
    done: false,
    taskId: null,
    plannedFor: new Date().toISOString().slice(0, 10),
  });
  broadcastWorkspaceChange({
    zone: "todos",
    entityType: "TODO",
    entityId: String(dashboardTodos.length),
    action: "CREATED",
  });
  await page.clock.fastForward(250);
  await page.getByText(resumedTitle, { exact: true }).waitFor();
  await waitForRequestCount("/workspaces/1/todos", 1);
  printAndAssertCounts("post-reconnect single-zone todo refresh", {
    maxRequestCount: 1,
    required: { "/workspaces/1/todos": 1 },
    forbidden: [
      "/auth/me",
      "/workspaces",
      "/notifications",
      "/workspaces/1/events",
      "/workspaces/1/dashboard",
    ],
  });

  await page.getByRole("link", { name: "Graph" }).click();
  await page.waitForURL(`${appUrl}/graph`);
  await page
    .getByRole("link", { name: "Open Multi-zone recovery task" })
    .waitFor();
  clearMetrics();
  dashboardTasks[0] = {
    ...dashboardTasks[0],
    title: "Graph projection updated through one refresh bundle",
    updatedAt: new Date(Date.now() + 9_000).toISOString(),
  };
  broadcastWorkspaceChange({
    zone: "tasks",
    entityType: "TASK",
    entityId: "1",
    action: "UPDATED",
  });
  await page.clock.fastForward(250);
  await page
    .getByRole("link", {
      name: "Open Graph projection updated through one refresh bundle",
    })
    .waitFor();
  await waitForRequestCount("/workspaces/1/dashboard/refresh", 1);
  printAndAssertCounts("active graph cache task refresh", {
    maxRequestCount: 1,
    required: { "/workspaces/1/dashboard/refresh": 1 },
    forbidden: [
      "/workspaces/1/dashboard",
      "/workspaces/1/tasks/1",
      "/workspaces/1/navigation-summary",
      "/workspaces/1/graph-view",
    ],
  });

  await context.close();
  await waitForOpenStreamCount(0);
}

async function measureRapidSidebarNavigation(browser) {
  const sessions = await Promise.all(
    Array.from({ length: clientCount }, async () => {
      const context = await browser.newContext();
      await context.addInitScript(() => {
        window.localStorage.setItem("openlog.dismiss-mcp-setup-prompt", "1");
      });
      const page = await context.newPage();
      await page.goto(`${appUrl}/dashboard`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Fanout Test" }).waitFor();
      return { context, page };
    }),
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  clearMetrics();

  await Promise.all(
    sessions.map(async ({ page }) => {
      await page.getByRole("link", { name: /^Tasks/ }).click();
      await page.waitForURL(`${appUrl}/tasks`);
      await page.getByRole("link", { name: /^Logs/ }).first().click();
      await page.waitForURL(`${appUrl}/logs`);
      await page.getByRole("link", { name: "Dashboard" }).click();
      await page.waitForURL(`${appUrl}/dashboard`);
      await page.getByRole("heading", { name: "Fanout Test" }).waitFor();
    }),
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  await waitForOpenStreamCount(clientCount);

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  printAndAssertCounts(`${clientCount} concurrent rapid sidebar navigation flows`, {
    maxRequestCount: 15,
    required: {
      "/workspaces/1/tasks": clientCount,
      "/workspaces/1/logs": clientCount,
    },
    forbidden: ["/auth/me", "/workspaces", "/notifications", "/app/bootstrap"],
  });
  if (total / clientCount > 3) {
    throw new Error(`rapid sidebar navigation exceeded 3 requests per user: ${total}.`);
  }

  await Promise.all(sessions.map(({ context }) => context.close()));
  await waitForOpenStreamCount(0);
}

async function setDocumentVisibility(page, visibilityState) {
  await page.evaluate((nextVisibilityState) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => nextVisibilityState === "hidden",
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => nextVisibilityState,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, visibilityState);
}

function assertOpenStreamCount(expected, label) {
  if (openStreams.size !== expected) {
    throw new Error(
      `${label}: expected ${expected} open SSE stream(s), received ${openStreams.size}.`,
    );
  }
}

async function waitForOpenStreamCount(expected, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (openStreams.size === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assertOpenStreamCount(expected, "SSE stream cleanup");
}

async function waitForRequestCount(pathname, expected, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((counts.get(pathname) ?? 0) >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(
    `Expected at least ${expected} request(s) to ${pathname}, received ${counts.get(pathname) ?? 0}.`,
  );
}

function clearMetrics() {
  counts.clear();
  responseBytes.clear();
}

function broadcastWorkspaceChange({ zone, entityType, entityId, action }) {
  const data = JSON.stringify({
    workspaceId: 1,
    zone,
    entityType,
    entityId,
    action,
    occurredAt: new Date().toISOString(),
  });
  for (const stream of openStreams) {
    stream.write(`event: workspace.changed\ndata: ${data}\n\n`);
  }
}

function printAndAssertCounts(label, { maxRequestCount, required, forbidden = [] }) {
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const totalBytes = [...responseBytes.values()].reduce(
    (sum, bytes) => sum + bytes,
    0,
  );
  console.log(`\nMeasured ${label}.`);
  console.log(`Backend API requests: ${total}`);
  console.log(`JSON response bytes: ${totalBytes}`);
  for (const [pathname, count] of entries) {
    console.log(`${String(count).padStart(4)} ${pathname}`);
  }
  if (total > maxRequestCount) {
    throw new Error(`${label}: expected at most ${maxRequestCount}, received ${total}.`);
  }
  for (const [pathname, expected] of Object.entries(required)) {
    if (counts.get(pathname) !== expected) {
      throw new Error(`${label}: expected ${expected} request(s) to ${pathname}.`);
    }
  }
  for (const pathname of forbidden) {
    if (counts.has(pathname)) {
      throw new Error(`${label}: unexpectedly requested ${pathname}.`);
    }
  }
  return { total, totalBytes };
}

async function measureScenario({
  browser,
  path,
  label,
  maxRequestCount,
  heading,
  forbiddenPaths = [],
}) {
  clearMetrics();
  await Promise.all(
    Array.from({ length: clientCount }, async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${appUrl}${path}`, {
        waitUntil: "domcontentloaded",
      });
      if (heading) {
        await page.getByRole("heading", { name: heading }).waitFor();
      }
      await page.waitForTimeout(2_000);
      await context.close();
    }),
  );

  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  console.log(`\nMeasured ${clientCount} concurrent ${label} visits.`);
  console.log(`Backend API requests: ${total}`);
  for (const [pathname, count] of entries) {
    console.log(`${String(count).padStart(4)} ${pathname}`);
  }
  if (total > maxRequestCount) {
    throw new Error(
      `${label} API fan-out regression: expected at most ${maxRequestCount}, received ${total}.`,
    );
  }
  for (const pathname of forbiddenPaths) {
    if (counts.has(pathname)) {
      throw new Error(`${label} unexpectedly requested ${pathname}.`);
    }
  }

  await waitForOpenStreamCount(0);
}
