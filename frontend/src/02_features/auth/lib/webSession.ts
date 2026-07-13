export const ACCESS_TOKEN_COOKIE_NAME = "openlog_access_token";
export const REFRESH_SESSION_COOKIE_NAME = "openlog_refresh_session";

const ACCESS_TOKEN_EXPIRY_SKEW_SECONDS = 30;

export function needsAccessTokenRefresh(
  accessToken: string | undefined,
  nowSeconds = Date.now() / 1000,
): boolean {
  if (!accessToken) {
    return true;
  }

  try {
    const encodedPayload = accessToken.split(".")[1];
    if (!encodedPayload) {
      return true;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { exp?: unknown };

    return (
      typeof payload.exp !== "number" ||
      payload.exp <= nowSeconds + ACCESS_TOKEN_EXPIRY_SKEW_SECONDS
    );
  } catch {
    return true;
  }
}

export function normalizeReturnTo(returnTo: string | null): string {
  if (
    !returnTo ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\r") ||
    returnTo.includes("\n")
  ) {
    return "/";
  }

  return returnTo;
}
