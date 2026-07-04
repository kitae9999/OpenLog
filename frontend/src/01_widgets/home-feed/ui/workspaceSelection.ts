import { defaultWorkspaceId } from "./data";

const STORAGE_KEY = "openlog-active-workspace";

export function getActiveWorkspaceId() {
  if (typeof window === "undefined") {
    return defaultWorkspaceId;
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? defaultWorkspaceId;
}

export function setActiveWorkspaceId(workspaceId: string) {
  window.localStorage.setItem(STORAGE_KEY, workspaceId);
}
