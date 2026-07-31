import { expect, test } from "@playwright/test";

test.describe("Output and post lifecycle", () => {
  test("starts an output blank and selects tasks and logs independently", async ({
    page,
  }) => {
    await page.goto("/e2e/output-post-lifecycle");
    const fixture = page.getByRole("region", {
      name: "Blank output creation fixture",
    });

    await expect(fixture.getByRole("textbox", { name: "Output title" })).toHaveValue("");
    await expect(fixture.getByRole("textbox", { name: "Output content" })).toHaveValue("");
    await expect(fixture.getByText("0 tasks · 0 logs selected")).toBeVisible();

    const firstTask = fixture.getByRole("checkbox", { name: "First task" });
    const secondLog = fixture.getByRole("checkbox", { name: /Second log/ });
    await expect(firstTask).not.toBeChecked();
    await expect(secondLog).not.toBeChecked();

    await firstTask.check();
    await expect(secondLog).not.toBeChecked();
    await expect(fixture.getByText("1 task · 0 logs selected")).toBeVisible();

    await secondLog.check();
    await expect(firstTask).toBeChecked();
    await expect(fixture.getByText("1 task · 1 log selected")).toBeVisible();

    await firstTask.uncheck();
    await expect(secondLog).toBeChecked();
    await expect(fixture.getByText("0 tasks · 1 log selected")).toBeVisible();
  });

  test("keeps an exported output read-only and links its post draft", async ({
    page,
  }) => {
    await page.goto("/e2e/output-post-lifecycle");
    const fixture = page.getByRole("region", { name: "Locked output fixture" });

    await expect(
      fixture
        .getByTestId("output-title-block")
        .getByText("Post created", { exact: true }),
    ).toBeVisible();
    await expect(
      fixture.getByText("Post created. This output is now read-only and kept as its source."),
    ).toBeVisible();
    await expect(fixture.getByRole("button", { name: "Edit" })).toHaveCount(0);
    await expect(fixture.getByRole("button", { name: "Create post" })).toHaveCount(0);
    await expect(fixture.getByRole("link", { name: "Edit post" })).toHaveAttribute(
      "href",
      "/posts/90/edit",
    );
  });

  test("submits ordinary writing as a server post draft", async ({ page }) => {
    await page.route("**/api/notifications/summary", (route) =>
      route.fulfill({ json: { unreadCount: 0 } }),
    );
    await page.goto("/e2e/post-draft");
    await page.evaluate(() => window.localStorage.removeItem("openlog.e2e.post-draft"));
    await page.reload();

    await page.getByRole("textbox", { name: "Title" }).fill("Server draft");
    await page.getByRole("textbox", { name: "Description" }).fill("Draft summary");
    await page.getByPlaceholder("Share your ideas, code, and insights…").fill("Draft body");
    await page.getByRole("button", { name: "Save draft" }).click();

    await expect(page).toHaveURL(/\/e2e\/post-draft\?saved=draft$/);
    await expect(page.getByRole("status")).toHaveText("Draft saved on server");
  });
});
