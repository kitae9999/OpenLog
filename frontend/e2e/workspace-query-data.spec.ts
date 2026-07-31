import { expect, test, type Page, type Route } from "@playwright/test";

const workspaceApiPath = "/api/workspaces/10";
const timestamp = "2026-07-31T09:00:00";

test.describe("Workspace query data completeness", () => {
  test("loads every task and memory cursor page", async ({ page }) => {
    const requests = await mockWorkspaceApi(page);

    await page.goto("/e2e/workspace-query?view=tasks");
    await expect(page.getByText("21 total", { exact: false })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Active 21" })).toBeVisible();
    expect(requests.tasks).toBe(2);

    await page.goto("/e2e/workspace-query?view=memory");
    await expect(page.getByText("51 total", { exact: false })).toBeVisible();
    expect(requests.memories).toBe(2);
  });

  test("provides tasks to issue filters and document editors", async ({
    page,
  }) => {
    await mockWorkspaceApi(page);

    await page.goto("/e2e/workspace-query?view=issues");
    await page.getByRole("button", { name: "Task" }).click();
    await expect(page.getByRole("menu")).toContainText("Task 1");

    await page.goto("/e2e/workspace-query?view=log-create");
    await expect(
      page.locator("select").filter({ hasText: "Task 1" }),
    ).toHaveCount(1);

    await page.goto("/e2e/workspace-query?view=memory-new");
    await expect(
      page.locator("select").filter({ hasText: "Task 1" }),
    ).toHaveCount(1);
  });

  test("shows related records on task log and output details", async ({
    page,
  }) => {
    await mockWorkspaceApi(page);

    await page.goto("/e2e/workspace-query?view=task-detail");
    await expect(page.getByTestId("task-logs-block")).toContainText(
      /Linked logs\s*2/,
    );
    await expect(page.getByText("Output 201", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Todo for task 1", { exact: true }),
    ).toBeVisible();

    await page.goto("/e2e/workspace-query?view=log-detail");
    await page.getByTestId("task-switcher").getByRole("button").click();
    await expect(page.getByRole("listbox")).toContainText("Task 1");
    await expect(page.getByText("Output 201", { exact: true })).toBeVisible();

    await page.goto("/e2e/workspace-query?view=output-detail");
    await expect(page.getByText("1 linked task · 1 linked log")).toBeVisible();
    await expect(page.getByText("Task 1", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Issue 101", { exact: true }).first(),
    ).toBeVisible();
  });
});

async function mockWorkspaceApi(page: Page) {
  const requests = { tasks: 0, memories: 0 };

  await page.route(`**${workspaceApiPath}/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === `${workspaceApiPath}/tasks/1`) {
      await fulfillJson(route, task(1));
      return;
    }
    if (path === `${workspaceApiPath}/tasks`) {
      requests.tasks += 1;
      const cursor = url.searchParams.get("cursor");
      await fulfillJson(route, {
        tasks: cursor
          ? [task(21)]
          : Array.from({ length: 20 }, (_, index) => task(index + 1)),
        size: 20,
        nextCursor: cursor ? null : "task-page-2",
        hasNext: cursor === null,
      });
      return;
    }
    if (path === `${workspaceApiPath}/logs/101`) {
      await fulfillJson(route, {
        ...log(101, "ISSUE"),
        content: "Issue content",
        closedAt: null,
      });
      return;
    }
    if (path === `${workspaceApiPath}/logs`) {
      await fulfillJson(route, {
        logs: [log(101, "ISSUE"), log(102, "NOTE")],
        size: 20,
        nextCursor: null,
        hasNext: false,
      });
      return;
    }
    if (path === `${workspaceApiPath}/outputs/201`) {
      await fulfillJson(route, {
        id: 201,
        status: "DRAFT",
        title: "Output 201",
        content: "Output content",
        tasks: [{ id: 1, title: "Task 1", status: "DOING" }],
        logs: [
          {
            id: 101,
            title: "Issue 101",
            kind: "ISSUE",
            status: "OPEN",
            taskId: 1,
          },
        ],
        linkedPost: null,
        updatedAt: timestamp,
        exportedAt: null,
      });
      return;
    }
    if (path === `${workspaceApiPath}/outputs`) {
      await fulfillJson(route, [
        {
          id: 201,
          status: "DRAFT",
          title: "Output 201",
          taskCount: 1,
          logCount: 1,
          taskIds: [1],
          logIds: [101],
          updatedAt: timestamp,
          exportedAt: null,
        },
      ]);
      return;
    }
    if (path === `${workspaceApiPath}/todos`) {
      await fulfillJson(route, [
        {
          id: 301,
          title: "Todo for task 1",
          done: false,
          taskId: 1,
          plannedFor: "2026-07-31",
        },
      ]);
      return;
    }
    if (path === `${workspaceApiPath}/memories`) {
      requests.memories += 1;
      const cursor = url.searchParams.get("cursor");
      await fulfillJson(route, {
        memories: cursor
          ? [memory(51)]
          : Array.from({ length: 50 }, (_, index) => memory(index + 1)),
        size: 50,
        nextCursor: cursor ? null : "memory-page-2",
        hasNext: cursor === null,
      });
      return;
    }

    await route.abort("failed");
  });

  return requests;
}

function task(id: number) {
  return {
    id,
    title: `Task ${id}`,
    description: `Task ${id} description`,
    content: `Task ${id} content`,
    status: "DOING",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function log(id: number, kind: "ISSUE" | "NOTE") {
  return {
    id,
    kind,
    status: kind === "ISSUE" ? "OPEN" : "NONE",
    title: kind === "ISSUE" ? `Issue ${id}` : `Note ${id}`,
    summary: `${kind} summary`,
    taskId: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function memory(id: number) {
  return {
    id,
    title: `Memory ${id}`,
    content: `Memory ${id} content`,
    excerpt: `Memory ${id} excerpt`,
    task: { id: 1, title: "Task 1" },
    originLog: id === 1 ? { id: 101, title: "Issue 101" } : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}
