import { expect, test, type Locator } from "@playwright/test";

test.describe("Workspace document bulk delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/document-bulk-delete");
  });

  test("selects individual and all visible tasks", async ({ page }) => {
    const fixture = page.getByRole("region", { name: "Tasks bulk fixture" });
    const bulkBar = fixture.getByTestId("document-bulk-bar");
    const initialBackground = await backgroundColor(bulkBar);
    await fixture.getByRole("checkbox", { name: "Select First task" }).click();
    await expect(fixture.getByText("1 selected")).toBeVisible();
    await expect.poll(() => backgroundColor(bulkBar)).toBe(initialBackground);
    await expect(
      fixture.getByRole("button", { name: "Delete selected" }),
    ).toBeVisible();

    const deleteButton = fixture.getByRole("button", {
      name: "Delete selected",
    });
    await deleteButton.hover();
    await expect.poll(() => hasNeutralBackground(deleteButton)).toBe(true);

    await fixture
      .getByRole("checkbox", { name: "Select all 2 visible tasks" })
      .click();
    await expect(fixture.getByText("2 selected")).toBeVisible();
    await expect.poll(() => backgroundColor(bulkBar)).toBe(initialBackground);

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
    await fixture.getByRole("button", { name: "Delete selected" }).click();

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
      fixture.getByRole("button", { name: "Delete selected" }),
    ).toBeInViewport();
    await fixture.getByRole("button", { name: "Delete selected" }).click();
    await expect(
      page.getByRole("dialog", { name: "Delete selected memories?" }),
    ).toBeInViewport();
  });
});

async function assertSelection(fixture: Locator, title: string) {
  const checkbox = fixture.getByRole("checkbox", { name: `Select ${title}` });
  const row = checkbox.locator("xpath=ancestor::article[1]");
  await checkbox.click();
  await expect(fixture.getByText("1 selected")).toBeVisible();
  await expect(
    fixture.getByRole("checkbox", { name: `Deselect ${title}` }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
}

async function backgroundColor(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).backgroundColor);
}

async function hasNeutralBackground(locator: Locator) {
  const color = await backgroundColor(locator);
  const oklch = color.match(/oklch\([^ ]+ ([^ ]+) /);
  if (oklch) return Number(oklch[1]) === 0;

  const rgb = color.match(/rgba?\((\d+),?\s+(\d+),?\s+(\d+)/);
  return rgb ? rgb[1] === rgb[2] && rgb[2] === rgb[3] : false;
}
