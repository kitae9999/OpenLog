import { expect, test } from "@playwright/test";
import path from "node:path";

const fixturePath = "/e2e/task-detail";
const screenshotDir = path.join("e2e", "screenshots");

test.describe("Task detail layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixturePath);
    await expect(page.getByTestId("task-detail")).toBeVisible();
  });

  test("uses suggest-style header with description and logs as main blocks", async ({
    page,
  }) => {
    await expect(page.getByTestId("task-title-block")).toBeVisible();
    await expect(page.getByTestId("task-description-block")).toBeVisible();
    await expect(page.getByTestId("task-logs-block")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Tasks" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark done" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Branches" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Spawned todos" }),
    ).toBeVisible();
  });

  test("keeps description edit and linked logs section", async ({ page }) => {
    await expect(
      page.getByTestId("task-description-block").getByRole("link", {
        name: "Edit",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Linked logs/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Link existing" }),
    ).toHaveAttribute("href", /\/logs/);
  });

  test("captures task detail screenshot for visual review", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.getByTestId("task-detail").screenshot({
      path: path.join(screenshotDir, "task-detail-suggest-layout.png"),
    });
  });
});
