import { expect, test } from "@playwright/test";

test.describe("Memory and activity UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/memory-activity");
  });

  test("renders persisted memory metadata and navigation", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Memory", exact: true })).toBeVisible();
    const memory = page.getByRole("link", { name: /Keep project context durable/ });
    await expect(memory).toBeVisible();
    await expect(memory).toHaveAttribute("href", "/memory/memory-1");
    await expect(memory).toContainText("from log");
  });

  test("renders activity intensity and selected day logs", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    const selected = page.getByRole("link", { name: "Jul 10, 2026, 3 logs" });
    await expect(selected).toHaveAttribute("aria-current", "date");
    await expect(page.getByRole("heading", { name: "Friday, July 10, 2026" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Memory decision/ })).toBeVisible();
  });
});
