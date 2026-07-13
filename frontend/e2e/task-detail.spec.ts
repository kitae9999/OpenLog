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

    await expect(page.getByRole("link", { name: "Tasks" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark done" })).toHaveCount(1);
    await expect(page.getByText("Status", { exact: true })).toBeVisible();
    await expect(page.getByText("Branches", { exact: true })).toBeVisible();
    await expect(page.getByText("Todos", { exact: true })).toBeVisible();
  });

  test("edits description inline without leaving the page", async ({ page }) => {
    const description = page.getByTestId("task-description-block");

    await expect(
      description.getByRole("button", { name: "Edit" }),
    ).toBeVisible();
    await expect(
      description.getByRole("link", { name: "Edit" }),
    ).toHaveCount(0);

    await description.getByRole("button", { name: "Edit" }).click();

    await expect(description.getByRole("button", { name: "Write" })).toBeVisible();
    await expect(
      description.getByRole("button", { name: "Preview" }),
    ).toBeVisible();
    await expect(description.locator("textarea")).toBeVisible();
    await expect(page).toHaveURL(/\/e2e\/task-detail/);

    await description.getByRole("button", { name: "Cancel" }).click();

    await expect(
      description.getByRole("button", { name: "Edit" }),
    ).toBeVisible();
    await expect(description.locator("textarea")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /Linked logs/ }),
    ).toBeVisible();
  });

  test("captures task detail screenshot for visual review", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.getByTestId("task-detail").screenshot({
      path: path.join(screenshotDir, "task-detail-suggest-layout.png"),
    });
  });
});
