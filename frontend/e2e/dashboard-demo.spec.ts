import { expect, test } from "@playwright/test";
import path from "node:path";

const fixturePath = "/e2e/dashboard-demo";
const outDir = path.join("e2e", "artifacts");

test.describe("Workspace dashboard visual review", () => {
  test("capture full page for readability review", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(fixturePath);
    await expect(page.getByTestId("workspace-dashboard-fixture")).toBeVisible();

    await page.screenshot({
      path: path.join(outDir, "workspace-dashboard-full.png"),
      fullPage: true,
    });

    await page.screenshot({
      path: path.join(outDir, "workspace-dashboard-above-fold.png"),
      fullPage: false,
    });
  });
});
