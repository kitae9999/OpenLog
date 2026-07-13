export const SITE_NAME = "OpenLog";
export const SITE_DESCRIPTION =
  "Keep the context behind the code, then turn it into durable developer knowledge.";
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
