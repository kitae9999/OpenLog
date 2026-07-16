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

    await expect(page).toHaveTitle("OpenLog — Workspace for AI agents");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "A workspace for AI agents. Capture tasks, logs, and memories, then connect them over MCP so context stays reusable.",
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

  test("marks tabbed home URLs as noindex with canonical root", async ({
    page,
  }) => {
    await page.goto("/?tab=workspace");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://openlog.kr",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("includes website JSON-LD on the home page", async ({ page }) => {
    await page.goto("/");
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);
    const payload = JSON.parse(await jsonLd.textContent() ?? "{}") as {
      "@graph"?: Array<{ "@type"?: string }>;
    };
    const types = (payload["@graph"] ?? []).map((node) => node["@type"]);
    expect(types).toContain("WebSite");
    expect(types).toContain("Organization");
  });
});
