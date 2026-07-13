import { expect, test } from "@playwright/test";

const postPath = "/@kentcdodds/posts/tailwind-v4";
const suggestionsPath = `${postPath}/suggestions`;

test.describe("Public post guest write controls", () => {
  test("hides comment and like mutation controls from guests", async ({ page }) => {
    await page.goto(postPath);

    await expect(page.getByPlaceholder("Leave a comment")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Like \(/ })).toHaveCount(0);
    await expect(page.getByLabel(/^Likes \(/).first()).toBeVisible();
  });

  test("hides suggestion creation and discussion composers from guests", async ({
    page,
  }) => {
    await page.goto(suggestionsPath);
    await expect(page.getByRole("link", { name: "+ New suggest" })).toHaveCount(0);

    await page.goto(`${suggestionsPath}/1`);
    await expect(page.getByPlaceholder("Leave a comment")).toHaveCount(0);
  });

  test("redirects direct guest suggestion creation to the suggestion list", async ({
    page,
  }) => {
    await page.goto(`${suggestionsPath}/new`);
    await expect(page).toHaveURL(new RegExp(`${suggestionsPath}$`));
    await expect(page.getByRole("link", { name: "+ New suggest" })).toHaveCount(0);
  });
});
