import { expect, test } from "@playwright/test";
import path from "node:path";

const fixturePath = "/e2e/log-detail";
const screenshotDir = path.join("e2e", "screenshots");

test.describe("Log detail layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixturePath);
    await expect(page.getByTestId("log-detail")).toBeVisible();
  });

  test("uses suggest-style header with content and sidebar blocks", async ({
    page,
  }) => {
    await expect(page.getByTestId("log-title-block")).toBeVisible();
    await expect(page.getByTestId("log-content-block")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toContainText("openlog");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toContainText("Logs");
    await expect(page.getByText("Task", { exact: true })).toBeVisible();
    await expect(page.getByTestId("task-switcher")).toBeVisible();
    await expect(page.getByText("Branch", { exact: true })).toBeVisible();
  });

  test("opens task switcher with open tasks and can assign", async ({
    page,
  }) => {
    await page.getByTestId("task-switcher").getByRole("button").first().click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option", { name: "Unassigned" })).toBeVisible();
    await expect(
      page.getByRole("option", { name: /홈 피드 → 워크스페이스 뷰 전환/ }),
    ).toBeVisible();

    await page
      .getByRole("option", { name: /홈 피드 → 워크스페이스 뷰 전환/ })
      .click();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(
      page.getByTestId("task-switcher").getByText("홈 피드 → 워크스페이스 뷰 전환"),
    ).toBeVisible();
  });

  test("edits content inline without leaving the page", async ({ page }) => {
    const content = page.getByTestId("log-content-block");

    await expect(page.getByTestId("log-commit-block")).toBeVisible();
    await expect(content.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(content.getByRole("link", { name: "Edit" })).toHaveCount(0);

    await content.getByRole("button", { name: "Edit" }).click();

    await expect(content.getByRole("button", { name: "Write" })).toBeVisible();
    await expect(content.getByRole("button", { name: "Preview" })).toBeVisible();
    await expect(content.locator("textarea")).toBeVisible();
    await expect(page).toHaveURL(/\/e2e\/log-detail/);

    await content.getByRole("button", { name: "Cancel" }).click();

    await expect(content.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(content.locator("textarea")).toHaveCount(0);
  });

  test("captures log detail screenshot for visual review", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.getByTestId("log-detail").screenshot({
      path: path.join(screenshotDir, "log-detail-layout.png"),
    });
  });
});
