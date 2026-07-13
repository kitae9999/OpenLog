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

  test("shows date tooltip and keeps each month in its own group", async ({
    page,
  }) => {
    const selected = page.getByRole("link", { name: "Jul 10, 2026, 3 logs" });
    await selected.hover();
    const tooltip = selected.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Jul 10, 2026");
    await expect(tooltip).toContainText("3 logs");

    const june = page.locator('[data-activity-month="2026-06"]');
    const july = page.locator('[data-activity-month="2026-07"]');
    await expect(june).toHaveCount(1);
    await expect(july).toHaveCount(1);
    await expect(june.getByRole("link", { name: /Jul/ })).toHaveCount(0);
    await expect(july.getByRole("link", { name: /Jun/ })).toHaveCount(0);
    await expect(
      july.getByRole("link", { name: "Jul 10, 2026, 3 logs" }),
    ).toHaveCount(1);

    const juneLastWeek = await june.locator("[data-activity-week]").last().boundingBox();
    const julyFirstWeek = await july.locator("[data-activity-week]").first().boundingBox();
    expect(juneLastWeek).not.toBeNull();
    expect(julyFirstWeek).not.toBeNull();
    expect(Math.abs(juneLastWeek!.x - julyFirstWeek!.x)).toBeLessThan(0.5);

    const juneBoundaryDay = june.getByRole("link", {
      name: "Jun 30, 2026, 0 logs",
    });
    await juneBoundaryDay.hover();
    await expect(juneBoundaryDay.getByRole("tooltip")).toBeVisible();
  });
});
