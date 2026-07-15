import { expect, test } from "@playwright/test";

const fixturePath = "/e2e/markdown-mermaid";

test.describe("Markdown Mermaid rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixturePath);
  });

  test("renders valid diagrams and preserves ordinary code blocks", async ({
    page,
  }) => {
    const diagrams = page.getByRole("img", {
      name: "Rendered Mermaid diagram",
    });

    await expect(diagrams).toHaveCount(2);
    await expect(diagrams.first().locator("svg")).toBeVisible();
    await expect(page.getByText("const ordinaryCode")).toBeVisible();
  });

  test("contains invalid syntax in a source fallback", async ({ page }) => {
    await expect(page.getByText("Diagram couldn't be rendered")).toBeVisible();

    await page.getByText("View Mermaid source").click();
    await expect(
      page.locator("details code").filter({ hasText: "A[Broken" }),
    ).toBeVisible();
  });

  test("keeps untrusted labels inert", async ({ page }) => {
    await expect(
      page.getByRole("img", { name: "Rendered Mermaid diagram" }),
    ).toHaveCount(2);

    const unsafeNodeCount = await page
      .locator(".markdown-mermaid script, .markdown-mermaid foreignObject")
      .count();
    const didExecute = await page.evaluate(
      () =>
        (window as typeof window & { __openlogMermaidXss?: boolean })
          .__openlogMermaidXss,
    );

    expect(unsafeNodeCount).toBe(0);
    expect(didExecute).toBeUndefined();
  });

  test("renders in dark mode and scrolls wide diagrams on mobile", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();

    const firstDiagram = page
      .getByRole("img", { name: "Rendered Mermaid diagram" })
      .first();
    await expect(firstDiagram.locator("svg")).toBeVisible();

    const overflow = await firstDiagram.locator("..").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));

    expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
    await expect(page.locator(".markdown-mermaid").first()).toHaveCSS(
      "background-color",
      "rgb(24, 24, 27)",
    );
  });
});
