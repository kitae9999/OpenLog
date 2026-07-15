export const SITE_NAME = "OpenLog";
/** Search / share snippet — English one-liner; MCP as proper noun. */
export const SITE_DESCRIPTION =
  "A workspace for AI agents. Capture tasks, logs, and memories, then connect them over MCP so context stays reusable.";
export const SITE_TITLE_DEFAULT = `${SITE_NAME} — Workspace for AI agents`;
export const SITE_URL = resolveSiteUrl();

function resolveSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredUrl) {
    return "https://openlog.kr";
  }

  try {
    return new URL(configuredUrl).toString().replace(/\/$/, "");
  } catch {
    return "https://openlog.kr";
  }
}
