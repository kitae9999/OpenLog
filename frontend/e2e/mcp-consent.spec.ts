import { expect, test } from "@playwright/test";

test.describe("Remote MCP consent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/mcp-consent");
  });

  test("shows client identity and defaults to safe-write", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Codex CLI/ }),
    ).toBeVisible();
    await expect(page.getByText("http://127.0.0.1:1455")).toBeVisible();
    await expect(page.getByRole("radio", { name: /safe-write/ })).toBeChecked();
    await expect(page.getByText("삭제 허용", { exact: true })).toBeVisible();
  });

  test("submits an explicit full permission approval", async ({ page }) => {
    await page.route(
      "http://localhost:8080/api/oauth2/consent",
      async (route) => {
        await route.fulfill({ status: 200, body: "approved" });
      },
    );
    await page.getByRole("radio", { name: /full/ }).check();

    const requestPromise = page.waitForRequest(
      "http://localhost:8080/api/oauth2/consent",
    );
    await page.getByRole("button", { name: "연결 승인" }).click();
    const request = await requestPromise;
    const form = new URLSearchParams(request.postData() ?? "");

    expect(request.method()).toBe("POST");
    expect(form.get("permissionProfile")).toBe("full");
    expect(form.get("decision")).toBe("approve");
    expect(form.get("challenge")).toBe(
      "fixture_challenge_0123456789abcdefghijk",
    );
  });

  test("submits a denial without requiring a permission change", async ({
    page,
  }) => {
    await page.route(
      "http://localhost:8080/api/oauth2/consent",
      async (route) => {
        await route.fulfill({ status: 200, body: "denied" });
      },
    );
    const requestPromise = page.waitForRequest(
      "http://localhost:8080/api/oauth2/consent",
    );

    await page.getByRole("button", { name: "거절" }).click();
    const form = new URLSearchParams((await requestPromise).postData() ?? "");

    expect(form.get("decision")).toBe("deny");
    expect(form.get("permissionProfile")).toBe("safe-write");
  });
});
