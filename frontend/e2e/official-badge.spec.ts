import { expect, test } from "@playwright/test";

test.describe("Official OpenLog badge", () => {
  test("renders only for official authors with an accessible label", async ({
    page,
  }) => {
    await page.goto("/e2e/official-badge");

    const badge = page.getByTestId("profile-context").getByRole("img", {
      name: "Official OpenLog account",
    });

    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute("title", "Official OpenLog account");
    await expect(badge).toHaveCSS("width", "16px");
    await expect(badge).toHaveCSS("height", "16px");

    const expectedBadgeCounts = [
      ["feed-context", 1],
      ["profile-context", 1],
      ["post-context", 2],
      ["suggestions-context", 1],
      ["suggestion-detail-context", 3],
    ] as const;

    for (const [testId, count] of expectedBadgeCounts) {
      await expect(
        page.getByTestId(testId).getByRole("img", {
          name: "Official OpenLog account",
        }),
      ).toHaveCount(count);
    }
  });

  test("keeps the badge visible without horizontal overflow on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/e2e/official-badge");

    const badges = page.getByRole("img", {
      name: "Official OpenLog account",
    });

    for (const badge of await badges.all()) {
      await expect(badge).toBeVisible();
      const box = await badge.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
  });
});
