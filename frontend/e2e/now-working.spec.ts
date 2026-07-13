import { expect, test } from "@playwright/test";

test.describe("Now working agent context", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/now-working");
  });

  test("presents branch, task, last work, and conversation context", async ({
    page,
  }) => {
    const card = page.getByTestId("now-working");

    await expect(card.getByText("Context live")).toBeVisible();
    await expect(card.getByText("feature/agent-context")).toBeVisible();
    await expect(card.getByText("Current context")).toBeVisible();
    await expect(
      card.getByText(/connected the active branch and task/),
    ).toBeVisible();

    await expect(
      card.getByRole("link", {
        name: /Active task Redesign the working-context dashboard/,
      }),
    ).toHaveAttribute("href", "/tasks/task-now-working");
    await expect(
      card.getByRole("link", { name: /Last work Removed diff-centric actions/ }),
    ).toHaveAttribute("href", "/logs/context-last-work");
    await expect(card.getByText("a1b2c3d")).toBeVisible();

    await expect(card.getByText("Considering")).toBeVisible();
    await expect(
      card.getByText(/persist independently from formal logs/),
    ).toBeVisible();
    await expect(card.getByText("Context trail")).toBeVisible();

    await expect(card.getByText("View diff")).toHaveCount(0);
    await expect(card.getByText("Log now")).toHaveCount(0);
    await expect(card.getByText("Create output")).toHaveCount(0);
  });
});
