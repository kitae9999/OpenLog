"use client";

import { useCallback, useEffect, useState } from "react";
import { getActiveWorkspaceId } from "./workspaceSelection";

export const WORKSPACE_CHANGE_EVENT = "openlog:workspace-change";

export function notifyWorkspaceChange() {
  window.dispatchEvent(new Event(WORKSPACE_CHANGE_EVENT));
}

export function useActiveWorkspaceId() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setWorkspaceId(getActiveWorkspaceId());
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener(WORKSPACE_CHANGE_EVENT, refresh);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(WORKSPACE_CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  return workspaceId;
}
