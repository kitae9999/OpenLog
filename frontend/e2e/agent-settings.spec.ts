import { expect, test } from "@playwright/test";

test.describe("Workspace Agent Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/agent-settings");
    await expect(page.getByRole("heading", { name: "OpenLog" })).toBeVisible();
  });

  test("previews the Guide and identifies remote and local projects", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Preview" }).click();
    await expect(
      page.getByRole("heading", { name: "Workspace Agent Guide" }),
    ).toBeVisible();
    await expect(page.getByText("Remote", { exact: true })).toBeVisible();
    await expect(page.getByText("Local", { exact: true })).toBeVisible();
    await expect(page.getByText("Bound by project ID in local .git/config")).toBeVisible();
  });

  test("shows the Agent Guide sidebar link without a route-specific workspace ID", async ({
    page,
  }) => {
    const link = page.getByRole("link", { name: "Agent Guide" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/settings/workspaces/10/agent");
  });

  test("shows per-project Capture Modes and asks before disconnecting", async ({
    page,
  }) => {
    const modes = page.getByLabel("Capture mode");
    await expect(modes).toHaveCount(2);
    await expect(modes.nth(0)).toHaveValue("ASK");
    await expect(modes.nth(1)).toHaveValue("EXPLICIT");

    await page.getByRole("button", { name: "Disconnect" }).first().click();
    await expect(page.getByRole("button", { name: "Confirm" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Confirm" })).toHaveCount(0);
  });
});
