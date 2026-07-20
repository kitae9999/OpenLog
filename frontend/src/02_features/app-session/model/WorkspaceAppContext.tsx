"use client";

import { createContext, useContext } from "react";
import type { AppBootstrap } from "@/features/app-session/model/appBootstrap";

export type WorkspaceAppContextValue = {
  bootstrap: AppBootstrap;
  activeWorkspaceId: string | null;
  selectWorkspace: (workspaceId: string) => void;
};

export const WorkspaceAppContext = createContext<WorkspaceAppContextValue | null>(null);

export function useWorkspaceApp() {
  const value = useContext(WorkspaceAppContext);
  if (!value) {
    throw new Error("useWorkspaceApp must be used inside WorkspaceAppShell.");
  }
  return value;
}

export function useOptionalWorkspaceApp() {
  return useContext(WorkspaceAppContext);
}
