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
    await expect(page.getByRole("link", { name: "Back to Logs" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Task" })).toBeVisible();
    await expect(page.getByTestId("task-switcher")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Capture" })).toBeVisible();
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

  test("shows related commit when present and content edit link", async ({
    page,
  }) => {
    await expect(page.getByTestId("log-commit-block")).toBeVisible();
    await expect(
      page.getByTestId("log-content-block").getByRole("link", { name: "Edit" }),
    ).toBeVisible();
  });

  test("captures log detail screenshot for visual review", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.getByTestId("log-detail").screenshot({
      path: path.join(screenshotDir, "log-detail-layout.png"),
    });
  });
});
