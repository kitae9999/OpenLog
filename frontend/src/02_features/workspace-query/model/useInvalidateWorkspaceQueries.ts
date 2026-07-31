"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOptionalWorkspaceApp } from "@/features/app-session/model/WorkspaceAppContext";
import type { WorkspaceActionResult } from "@/features/workspace-actions/api/workspaceActions";

export type WorkspaceQueryZone =
  | "tasks"
  | "logs"
  | "todos"
  | "outputs"
  | "memories"
  | "links"
  | "workspace";

export function useInvalidateWorkspaceQueries() {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useOptionalWorkspaceApp()?.activeWorkspaceId;

  return useCallback(
    async (zone: WorkspaceQueryZone) => {
      if (!activeWorkspaceId) return;
      const prefix = ["workspace", activeWorkspaceId] as const;
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (key[0] !== prefix[0] || key[1] !== prefix[1]) return false;
          const resource = key[2];
          if (zone === "workspace") return true;
          if (zone === "tasks") {
            return (
              resource === "tasks" ||
              resource === "task" ||
              resource === "dashboard"
            );
          }
          if (zone === "logs") {
            return (
              resource === "logs" ||
              resource === "log" ||
              resource === "dashboard"
            );
          }
          if (zone === "todos") {
            return (
              resource === "todos" ||
              resource === "planner" ||
              resource === "dashboard"
            );
          }
          if (zone === "outputs") {
            return (
              resource === "outputs" ||
              resource === "output" ||
              resource === "dashboard"
            );
          }
          if (zone === "memories") {
            return (
              resource === "memories" ||
              resource === "memory" ||
              resource === "dashboard"
            );
          }
          return resource === "graph";
        },
        refetchType: "active",
      });
    },
    [activeWorkspaceId, queryClient],
  );
}

export function useWorkspaceMutation(zone: WorkspaceQueryZone) {
  const invalidateWorkspace = useInvalidateWorkspaceQueries();
  return useMutation({
    mutationFn: (mutation: () => Promise<WorkspaceActionResult>) => mutation(),
    onSuccess: async (result) => {
      if (result.ok) await invalidateWorkspace(zone);
    },
  });
}
