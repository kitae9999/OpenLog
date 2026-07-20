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
const openStreams = new Set();
const dashboardTodos = [];

function record(pathname) {
  counts.set(pathname, (counts.get(pathname) ?? 0) + 1);
}

function json(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

const mockApi = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", apiUrl);
  record(url.pathname);

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
      tasks: [],
      nextCursor: null,
      hasNext: false,
    });
    return;
  }

  if (url.pathname === "/workspaces/1/dashboard") {
    json(response, 200, {
      tasks: [],
      logs: [],
      taskLinks: [],
      logLinks: [],
      crossLinks: [],
      todos: dashboardTodos,
      outputs: [],
      memories: [],
      workingBrief: null,
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

  if (url.pathname === "/workspaces/1/navigation-summary") {
    json(response, 200, {
      activeTaskCount: 0,
      logsCount: 0,
      openIssuesCount: 0,
    });
    return;
  }

  if (url.pathname === "/workspaces/1/logs") {
    json(response, 200, {
      logs: [],
      nextCursor: null,
      hasNext: false,
    });
    return;
  }

  if (url.pathname === "/workspaces/1/memories") {
    json(response, 200, {
      memories: [],
      nextCursor: null,
      hasNext: false,
    });
    return;
  }

  if (url.pathname === "/workspaces/1/working-brief") {
    json(response, 404, { code: "NOT_FOUND" });
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

  if (url.pathname === "/notifications") {
    json(response, 200, { notifications: [], unreadCount: 0 });
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
    url.pathname === "/workspaces/1/cross-links" ||
    url.pathname === "/workspaces/1/todos" ||
    url.pathname === "/workspaces/1/outputs"
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
    maxRequestCount: 25,
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

  counts.clear();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Fanout Test" }).waitFor();
  await page.waitForTimeout(500);
  printAndAssertCounts("manual dashboard reload", {
    maxRequestCount: 5,
    required: {
      "/auth/me": 1,
      "/workspaces": 1,
      "/workspaces/1/dashboard": 1,
    },
  });

  counts.clear();
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

  counts.clear();
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
  await page.waitForTimeout(300);
  printAndAssertCounts("SSE dashboard refresh", {
    maxRequestCount: 1,
    required: { "/workspaces/1/dashboard": 1 },
    forbidden: ["/auth/me", "/workspaces", "/notifications"],
  });

  await context.close();
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
  counts.clear();

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

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  printAndAssertCounts(`${clientCount} concurrent rapid sidebar navigation flows`, {
    maxRequestCount: 75,
    required: {
      "/workspaces/1/dashboard": clientCount,
      "/workspaces/1/tasks": clientCount * 2,
      "/workspaces/1/logs": clientCount * 2,
    },
  });
  if (total / clientCount > 15) {
    throw new Error(`rapid sidebar navigation exceeded 15 requests per user: ${total}.`);
  }

  await Promise.all(sessions.map(({ context }) => context.close()));
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
  console.log(`\nMeasured ${label}.`);
  console.log(`Backend API requests: ${total}`);
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
}

async function measureScenario({
  browser,
  path,
  label,
  maxRequestCount,
  heading,
  forbiddenPaths = [],
}) {
  counts.clear();
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
}
