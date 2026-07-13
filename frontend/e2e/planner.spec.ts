import { expect, test } from "@playwright/test";

test.describe("Planner UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/planner");
  });

  test("renders selected date todos and linked task", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "July 2026" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Friday, July 10" }),
    ).toBeVisible();

    const selectedDay = page.getByRole("link", { name: /10/ }).filter({
      has: page.getByText("Connect planner API"),
    });
    await expect(selectedDay).toHaveAttribute("aria-current", "date");
    await expect(selectedDay).toHaveAttribute(
      "href",
      "/planner?month=2026-07&date=2026-07-10",
    );
    await expect(page.getByText("Verify mobile calendar").last()).toHaveClass(
      /line-through/,
    );
    await expect(page.getByRole("link", { name: "Ship planner" })).toHaveAttribute(
      "href",
      "/tasks/task-1",
    );
  });

  test("keeps calendar horizontally scrollable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const calendar = page.getByRole("region", { name: "July 2026 calendar" });
    await expect(calendar).toBeVisible();
    const dimensions = await calendar.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
    await expect(page.getByPlaceholder("What needs to happen?")).toBeVisible();
  });

  test("separates today from the month navigation controls", async ({ page }) => {
    const monthNavigation = page.getByRole("navigation", {
      name: "Month navigation",
    });
    await expect(
      monthNavigation.getByRole("link", { name: "Previous month, June 2026" }),
    ).toHaveAttribute("href", "/planner?month=2026-06");
    await expect(
      monthNavigation.getByRole("link", { name: "Next month, August 2026" }),
    ).toHaveAttribute("href", "/planner?month=2026-08");
    await expect(monthNavigation.getByText("Today")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Jump to current month" }),
    ).toBeVisible();
  });
});
