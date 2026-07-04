"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDefaultWorkspace,
  getWorkspaceById,
  type UserWorkspace,
} from "./data";
import { getActiveWorkspaceId } from "./workspaceSelection";

export const WORKSPACE_CHANGE_EVENT = "openlog:workspace-change";

export function notifyWorkspaceChange() {
  window.dispatchEvent(new Event(WORKSPACE_CHANGE_EVENT));
}

export function useActiveWorkspace() {
  const [workspace, setWorkspace] = useState<UserWorkspace>(getDefaultWorkspace());

  const refresh = useCallback(() => {
    setWorkspace(getWorkspaceById(getActiveWorkspaceId()) ?? getDefaultWorkspace());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(WORKSPACE_CHANGE_EVENT, refresh);

    return () => {
      window.removeEventListener(WORKSPACE_CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  return workspace;
}
