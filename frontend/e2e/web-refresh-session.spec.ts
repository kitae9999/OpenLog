import { expect, test } from "@playwright/test";

test.describe("Web refresh session", () => {
  test("redirects an expired session through the refresh route", async ({
    request,
  }) => {
    const response = await request.get("/e2e/guest-preview?section=workspace", {
      headers: {
        cookie: "openlog_refresh_session=1",
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    const location = new URL(response.headers().location, "http://openlog.test");
    expect(location.pathname).toBe("/auth/refresh");
    expect(location.searchParams.get("returnTo")).toBe(
      "/e2e/guest-preview?section=workspace",
    );
  });

  test("keeps a session with a valid access token on the requested page", async ({
    request,
  }) => {
    const payload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }),
    ).toString("base64url");
    const response = await request.get("/e2e/guest-preview", {
      headers: {
        cookie: `openlog_refresh_session=1; openlog_access_token=x.${payload}.x`,
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(200);
  });
});
