const STORAGE_KEY = "openlog-active-workspace";
export const ACTIVE_WORKSPACE_COOKIE = "openlog-active-workspace";

export function getActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function setActiveWorkspaceId(workspaceId: string) {
  window.localStorage.setItem(STORAGE_KEY, workspaceId);
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=${encodeURIComponent(workspaceId)}; path=/; max-age=31536000; SameSite=Lax`;
}

export function clearActiveWorkspaceId(workspaceId?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (workspaceId && window.localStorage.getItem(STORAGE_KEY) !== workspaceId) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
