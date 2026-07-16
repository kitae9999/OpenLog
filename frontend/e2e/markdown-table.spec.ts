import { expect, test } from "@playwright/test";

const fixturePath = "/e2e/markdown-table";

test.describe("Markdown table rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixturePath);
  });

  test("renders a GFM table with inline content and column alignment", async ({
    page,
  }) => {
    const table = page.getByRole("table");

    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader")).toHaveCount(4);
    await expect(table.locator("tbody tr")).toHaveCount(5);
    await expect(table.getByRole("columnheader", { name: "항목" })).toHaveCSS(
      "text-align",
      "left",
    );
    await expect(
      table.getByRole("columnheader", { name: "MCP 미사용" }),
    ).toHaveCSS("text-align", "right");
    await expect(
      table.getByRole("cell", { name: "총 토큰" }).locator("strong"),
    ).toHaveText("총 토큰");
    await expect(
      table.getByRole("cell", { name: "+15,053 (+99.6%)" }),
    ).toBeVisible();
    await expect(
      page.getByText("The table keeps inline formatting and column alignment."),
    ).toBeVisible();
  });

  test("keeps a wide table horizontally scrollable on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();

    const overflow = await page
      .getByRole("table")
      .locator("..")
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));

    expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
  });
});
