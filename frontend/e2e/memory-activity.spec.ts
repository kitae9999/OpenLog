import { expect, test } from "@playwright/test";

test.describe("Memory and activity UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/memory-activity");
  });

  test("renders persisted memory metadata and navigation", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Memory", exact: true }),
    ).toBeVisible();
    const memory = page.getByRole("link", {
      name: /Keep project context durable/,
    });
    await expect(memory).toBeVisible();
    await expect(memory).toHaveAttribute("href", "/memory/memory-1");
    await expect(page.getByText("from log", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Memory decision" }),
    ).toHaveAttribute("href", "/logs/log-1");
  });

  test("renders activity intensity and selected day logs", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Activity", exact: true }),
    ).toBeVisible();
    const selected = page.getByRole("link", { name: "Jul 10, 2026, 3 logs" });
    await expect(selected).toHaveAttribute("aria-current", "date");
    await expect(
      page.getByRole("heading", { name: "Friday, July 10, 2026" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Memory decision/ }),
    ).toBeVisible();

    const today = page.getByRole("link", { name: "Jul 13, 2026, 0 logs" });
    await expect(today).toHaveClass(/ring-\[#a85638\]/);

    const future = page.getByRole("img", { name: "Jul 31, 2026, Planned" });
    await expect(future).toBeVisible();
    await expect(future).toHaveClass(/border-dashed/);
    await expect(future).not.toHaveAttribute("href");
    await future.hover();
    await expect(future.getByRole("tooltip")).toContainText("Planned");

    const activityLevels = [
      { name: "Apr 2, 2026, 2 logs", level: "1" },
      { name: "May 4, 2026, 5 logs", level: "2" },
      { name: "Jun 24, 2026, 9 logs", level: "3" },
      { name: "Jul 3, 2026, 10 logs", level: "4" },
    ];
    for (const activityLevel of activityLevels) {
      await expect(
        page.getByRole("link", { name: activityLevel.name }),
      ).toHaveAttribute("data-activity-level", activityLevel.level);
    }

    for (const label of [
      "No logs",
      "1–2 logs",
      "3–5 logs",
      "6–9 logs",
      "10+ logs",
    ]) {
      await expect(page.getByRole("img", { name: label })).toBeVisible();
    }
  });

  test("starts an overflowing activity grid at the latest dates", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.reload();

    await expect
      .poll(() =>
        page
          .locator("[data-activity-scroll]")
          .evaluate(
            (element) =>
              element.scrollWidth - element.clientWidth - element.scrollLeft,
          ),
      )
      .toBe(0);

    const scrollPosition = await page
      .locator("[data-activity-scroll]")
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
      }));
    expect(scrollPosition.scrollWidth).toBeGreaterThan(
      scrollPosition.clientWidth,
    );
    expect(scrollPosition.scrollLeft).toBe(
      scrollPosition.scrollWidth - scrollPosition.clientWidth,
    );
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
    const weekdayLabels = page.locator("[data-activity-weekday-labels]");
    await expect(june).toHaveCount(1);
    await expect(july).toHaveCount(1);
    await expect(weekdayLabels.getByText("Mon", { exact: true })).toBeVisible();
    await expect(weekdayLabels.getByText("Wed", { exact: true })).toBeVisible();
    await expect(weekdayLabels.getByText("Fri", { exact: true })).toBeVisible();
    await expect(june.getByText("Jun", { exact: true })).toBeVisible();
    await expect(july.getByText("Jul", { exact: true })).toBeVisible();
    const labelsAreOutsideScroll = await weekdayLabels.evaluate(
      (element) => element.closest("[data-activity-scroll]") === null,
    );
    expect(labelsAreOutsideScroll).toBe(true);
    const cellSize = await july
      .getByRole("link", { name: "Jul 10, 2026, 3 logs" })
      .evaluate((cell) => Number.parseFloat(getComputedStyle(cell).width));
    expect(cellSize).toBe(11);
    const labelToGrassGap = await page.evaluate(() => {
      const labels = document.querySelector<HTMLElement>(
        "[data-activity-weekday-labels]",
      );
      const months = document.querySelector<HTMLElement>(
        "[data-activity-months]",
      );
      if (!labels || !months) return Number.NaN;
      return (
        months.getBoundingClientRect().left -
        labels.getBoundingClientRect().right
      );
    });
    expect(labelToGrassGap).toBe(4);
    const scrollFitsContent = await page
      .locator("[data-activity-scroll]")
      .evaluate((element) => element.scrollWidth === element.clientWidth);
    expect(scrollFitsContent).toBe(true);
    await expect(june.getByRole("link", { name: /Jul/ })).toHaveCount(0);
    await expect(july.getByRole("link", { name: /Jun/ })).toHaveCount(0);
    await expect(
      july.getByRole("link", { name: "Jul 10, 2026, 3 logs" }),
    ).toHaveCount(1);

    const contourGap = await page.evaluate(() => {
      const getRightmostByRow = (selector: string) => {
        const rows = new Map<number, DOMRect>();
        document
          .querySelectorAll<HTMLElement>(`${selector} a`)
          .forEach((cell) => {
            const box = cell.getBoundingClientRect();
            const current = rows.get(box.y);
            if (!current || box.right > current.right) rows.set(box.y, box);
          });
        return rows;
      };
      const getLeftmostByRow = (selector: string) => {
        const rows = new Map<number, DOMRect>();
        document
          .querySelectorAll<HTMLElement>(`${selector} a`)
          .forEach((cell) => {
            const box = cell.getBoundingClientRect();
            const current = rows.get(box.y);
            if (!current || box.left < current.left) rows.set(box.y, box);
          });
        return rows;
      };
      const juneRows = getRightmostByRow('[data-activity-month="2026-06"]');
      const julyRows = getLeftmostByRow('[data-activity-month="2026-07"]');

      return Math.min(
        ...Array.from(juneRows, ([row, juneCell]) => {
          const julyCell = julyRows.get(row);
          return julyCell
            ? julyCell.left - juneCell.right
            : Number.POSITIVE_INFINITY;
        }),
      );
    });
    expect(contourGap).toBe(10);

    const juneBoundaryDay = june.getByRole("link", {
      name: "Jun 30, 2026, 0 logs",
    });
    await juneBoundaryDay.hover();
    await expect(juneBoundaryDay.getByRole("tooltip")).toBeVisible();
  });
});
