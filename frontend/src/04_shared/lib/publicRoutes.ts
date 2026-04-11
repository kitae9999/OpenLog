const HANDLE_PREFIX = "@";
const USERNAME_PATTERN = /^[a-z0-9]{3,20}$/;

function decodeRouteSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeUsername(username: string) {
  const trimmed = decodeRouteSegment(username).trim();
  return trimmed.startsWith(HANDLE_PREFIX) ? trimmed.slice(1) : trimmed;
}

export function parsePublicUsernameParam(usernameParam: string) {
  const normalized = normalizeUsername(usernameParam);
  if (!normalized || !USERNAME_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

export function parsePublicPostSlugParam(postSlugParam: string) {
  const normalized = decodeRouteSegment(postSlugParam).trim();
  return normalized || null;
}

export function buildPublicProfilePath(username: string) {
  return `/${HANDLE_PREFIX}${encodeURIComponent(normalizeUsername(username))}`;
}

export function buildPublicPostPath(username: string, slug: string) {
  return `${buildPublicProfilePath(username)}/posts/${encodeURIComponent(slug)}`;
}

export function buildPublicSuggestsPath(username: string, slug: string) {
  return `${buildPublicPostPath(username, slug)}/suggests`;
}

export function buildPublicSuggestDetailPath(
  username: string,
  slug: string,
  suggestionId: string,
) {
  return `${buildPublicSuggestsPath(username, slug)}/${encodeURIComponent(suggestionId)}`;
}

export function buildViewerProfileHref(username?: string | null) {
  return username ? buildPublicProfilePath(username) : "/onboarding";
}
