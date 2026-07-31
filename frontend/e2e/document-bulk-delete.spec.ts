import { expect, test, type Locator } from "@playwright/test";

test.describe("Workspace document bulk delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/document-bulk-delete");
  });

  test("selects individual and all visible tasks", async ({ page }) => {
    const fixture = page.getByRole("region", { name: "Tasks bulk fixture" });
    const bulkBar = fixture.getByTestId("document-bulk-bar");

    await expect(bulkBar).toHaveCount(0);

    await fixture.getByRole("checkbox", { name: "Select First task" }).click();
    await expect(bulkBar).toBeVisible();
    await expect(fixture.getByText("1 selected")).toBeVisible();
    await expect(fixture.getByRole("button", { name: "Delete" })).toBeVisible();

    await fixture
      .getByRole("checkbox", { name: "Select all 2 visible tasks" })
      .click();
    await expect(fixture.getByText("2 selected")).toBeVisible();

    await fixture.getByRole("button", { name: "Clear" }).click();
    await expect(bulkBar).toHaveCount(0);
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

  test("switches the issues list between open and closed statuses", async ({
    page,
  }) => {
    const fixture = page.getByRole("region", { name: "Logs bulk fixture" });

    await expect(
      fixture.getByRole("link", { name: "First log", exact: true }),
    ).toBeVisible();
    await expect(
      fixture.getByRole("link", { name: "Closed log", exact: true }),
    ).toHaveCount(0);

    await fixture.getByRole("button", { name: /^Status/ }).click();
    await fixture.getByRole("menuitem").filter({ hasText: "Closed" }).click();

    await expect(page).toHaveURL(/status=closed/);
    await expect(
      fixture.getByRole("link", { name: "Closed log", exact: true }),
    ).toBeVisible();
    await expect(
      fixture.getByRole("link", { name: "First log", exact: true }),
    ).toHaveCount(0);
    await expect(
      fixture.getByRole("button", { name: /Status.*Closed/ }),
    ).toBeVisible();
  });

  test("asks for confirmation before deleting selected documents", async ({
    page,
  }) => {
    const fixture = page.getByRole("region", { name: "Logs bulk fixture" });
    await fixture.getByRole("checkbox", { name: "Select First log" }).click();
    await fixture.getByRole("button", { name: "Delete" }).click();

    const dialog = page.getByRole("dialog", {
      name: "Delete selected logs?",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      "1 selected log will be permanently deleted.",
    );
    await expect(dialog).toContainText("Linked memories will be kept.");
    await dialog.getByRole("button", { name: "Cancel" }).click();

    await expect(dialog).toHaveCount(0);
    await expect(fixture.getByText("1 selected")).toBeVisible();
  });

  test("keeps bulk controls usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixture = page.getByRole("region", { name: "Memory bulk fixture" });
    await fixture
      .getByRole("checkbox", { name: "Select First memory" })
      .click();
    await expect(
      fixture.getByRole("button", { name: "Delete" }),
    ).toBeInViewport();
    await fixture.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("dialog", { name: "Delete selected memories?" }),
    ).toBeInViewport();
  });
});

async function assertSelection(fixture: Locator, title: string) {
  const checkbox = fixture.getByRole("checkbox", { name: `Select ${title}` });
  await checkbox.click();
  await expect(fixture.getByText("1 selected")).toBeVisible();
  await expect(
    fixture.getByRole("checkbox", { name: `Deselect ${title}` }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(fixture.getByTestId("document-bulk-bar")).toBeVisible();
}
