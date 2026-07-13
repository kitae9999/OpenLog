import { expect, test } from "@playwright/test";

test.describe("SEO metadata and crawler controls", () => {
  test("serves robots.txt with public allow and private route defenses", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /e2e/");
    expect(body).toContain("Disallow: /*/posts/*/suggestions");
    expect(body).toContain("Sitemap: https://openlog.kr/sitemap.xml");
    expect(body).toContain("Host: https://openlog.kr");
  });

  test("serves a sitemap with the canonical site root", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toContain("<loc>https://openlog.kr</loc>");
  });

  test("adds root metadata and noindex headers to private routes", async ({
    page,
  }) => {
    const response = await page.goto("/landing-preview");
    expect(response?.headers()["x-robots-tag"]).toBe(
      "noindex, nofollow, noarchive, nosnippet",
    );

    await expect(page).toHaveTitle(
      "OpenLog — Keep the context behind the code",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Keep the context behind the code, then turn it into durable developer knowledge.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://openlog.kr",
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "OpenLog",
    );
  });
});
