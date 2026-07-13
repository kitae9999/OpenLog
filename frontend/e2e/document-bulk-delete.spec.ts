import { expect, test, type Locator } from "@playwright/test";

test.describe("Workspace document bulk delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/document-bulk-delete");
  });

  test("selects individual and all visible tasks", async ({ page }) => {
    const fixture = page.getByRole("region", { name: "Tasks bulk fixture" });
    await fixture.getByRole("checkbox", { name: "Select First task" }).click();
    await expect(fixture.getByText("1 selected")).toBeVisible();
    await expect(
      fixture.getByRole("button", { name: "Delete selected" }),
    ).toBeVisible();

    await fixture
      .getByRole("checkbox", { name: "Select all 2 visible tasks" })
      .click();
    await expect(fixture.getByText("2 selected")).toBeVisible();

    await fixture.getByRole("button", { name: "Clear" }).click();
    await expect(
      fixture.getByRole("button", { name: "Delete selected" }),
    ).toHaveCount(0);
  });

  test("enables selection in every document list", async ({ page }) => {
    await assertSelection(
      page.getByRole("region", { name: "Logs bulk fixture" }),
      "First log",
    );
    await assertSelection(
      page.getByRole("region", { name: "Outputs bulk fixture" }),
      "First output",
    );
    await assertSelection(
      page.getByRole("region", { name: "Memory bulk fixture" }),
      "First memory",
    );
  });

  test("asks for confirmation before deleting selected documents", async ({
    page,
  }) => {
    const fixture = page.getByRole("region", { name: "Logs bulk fixture" });
    await fixture.getByRole("checkbox", { name: "Select First log" }).click();
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Delete 1 selected log?");
      await dialog.dismiss();
    });
    await fixture.getByRole("button", { name: "Delete selected" }).click();
    await expect(fixture.getByText("1 selected")).toBeVisible();
  });

  test("keeps bulk controls usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixture = page.getByRole("region", { name: "Memory bulk fixture" });
    await fixture
      .getByRole("checkbox", { name: "Select First memory" })
      .click();
    await expect(
      fixture.getByRole("button", { name: "Delete selected" }),
    ).toBeInViewport();
  });
});

async function assertSelection(fixture: Locator, title: string) {
  await fixture.getByRole("checkbox", { name: `Select ${title}` }).click();
  await expect(fixture.getByText("1 selected")).toBeVisible();
  await expect(
    fixture.getByRole("checkbox", { name: `Deselect ${title}` }),
  ).toHaveAttribute("aria-checked", "true");
}
