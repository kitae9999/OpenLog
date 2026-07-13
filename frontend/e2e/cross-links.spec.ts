import { expect, test } from "@playwright/test";

test.describe("Cross-type workspace links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/cross-links");
  });

  test("selects different document types and exposes generic relations", async ({
    page,
  }) => {
    const from = page.getByRole("combobox", { name: "From" });
    await from.fill("Ship cross links");
    await page.getByRole("option", { name: /Ship cross links/ }).click();

    const to = page.getByRole("combobox", { name: "To" });
    await to.fill("Graph model decision");
    await page.getByRole("option", { name: /Graph model decision/ }).click();

    const relationship = page.getByLabel("Relationship");
    await expect(relationship).toBeEnabled();
    await relationship.selectOption("REFERENCES");
    await expect(relationship).toHaveValue("REFERENCES");
    await expect(
      page.getByRole("button", { name: "Add connection" }),
    ).toBeEnabled();
  });

  test("lists a persisted cross-type connection", async ({ page }) => {
    const connection = page.getByRole("listitem");
    await expect(connection).toContainText("task → memory");
    await expect(connection).toContainText("Ship cross links");
    await expect(connection).toContainText("supports");
    await expect(connection).toContainText("Graph model decision");
  });
});
