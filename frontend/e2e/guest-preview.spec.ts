import { expect, test } from "@playwright/test";

const fixturePath = "/e2e/guest-preview";

test.describe("Guest preview demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(fixturePath);
    await expect(page.getByTestId("guest-preview-demo")).toBeVisible();
  });

  test("shows Claude icon, Chrome browser chrome, stage bar, and no CTA/Replay noise", async ({
    page,
  }) => {
    await expect(page.getByTestId("guest-preview-terminal")).toBeVisible();
    await expect(page.getByTestId("guest-preview-browser")).toBeVisible();
    await expect(page.getByTestId("guest-preview-stage-bar")).toBeVisible();

    const claudeIcon = page.getByTestId("claude-icon");
    await expect(claudeIcon).toBeVisible();
    await expect(claudeIcon).toContainText("✻");
    await expect(claudeIcon).toContainText("Welcome to Claude Code");

    await expect(
      page.getByTestId("guest-preview-browser").getByText("openlog.kr"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("guest-preview-browser")
        .getByText("OpenLog", { exact: true }),
    ).toBeVisible();

    // Stage pills present; reduced-motion lands on final link stage.
    await expect(page.getByTestId("guest-preview-stage-launch")).toBeVisible();
    await expect(page.getByTestId("guest-preview-stage-link")).toHaveAttribute(
      "data-active",
      "true",
    );

    await expect(page.getByText("Idle", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Replay", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Skip", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "Your next post is already in the work",
      }),
    ).toHaveCount(0);
    await expect(page.getByText(/Session captured in openlog/i)).toHaveCount(0);
    await expect(page.getByText(/Claude Code v2/i)).toHaveCount(0);
  });

  test("browser pane stays fixed height and scrolls a scaled full-size canvas", async ({
    page,
  }) => {
    const browser = page.getByTestId("guest-preview-browser");
    const stage = page.getByTestId("guest-preview-browser-stage");
    const canvas = page.getByTestId("guest-preview-fullsize-canvas");
    const terminal = page.getByTestId("guest-preview-terminal");
    await expect(stage).toBeVisible();
    await expect(canvas).toBeVisible();

    const browserBox = await browser.boundingBox();
    const stageBox = await stage.boundingBox();
    const terminalBox = await terminal.boundingBox();
    expect(browserBox).toBeTruthy();
    expect(stageBox).toBeTruthy();
    expect(terminalBox).toBeTruthy();

    expect(stageBox!.y).toBeGreaterThanOrEqual(browserBox!.y);
    expect(stageBox!.y + stageBox!.height).toBeLessThanOrEqual(
      browserBox!.y + browserBox!.height + 1,
    );

    expect(browserBox!.height).toBeGreaterThanOrEqual(360);
    expect(browserBox!.height).toBeLessThanOrEqual(720);

    // On the stacked (mobile) layout the browser is intentionally taller;
    // on lg they share the same row height.
    if (browserBox!.width > 700) {
      expect(
        Math.abs(browserBox!.height - terminalBox!.height),
      ).toBeLessThanOrEqual(2);
    } else {
      expect(browserBox!.height).toBeGreaterThanOrEqual(terminalBox!.height);
    }

    const canvasMeta = await canvas.evaluate((el) => {
      const style = getComputedStyle(el);
      const transform = style.transform;
      const width = parseFloat(style.width);
      const scaleMatch = /matrix\(([^,]+)/.exec(transform);
      const scale = scaleMatch ? Number(scaleMatch[1]) : 1;
      return { width, scale };
    });
    expect(canvasMeta.width).toBe(1100);
    expect(canvasMeta.scale).toBeGreaterThan(0);
    expect(canvasMeta.scale).toBeLessThanOrEqual(1);

    const overflowY = await stage.evaluate(
      (el) => getComputedStyle(el).overflowY,
    );
    expect(["auto", "scroll", "overlay"]).toContain(overflowY);
  });
});
