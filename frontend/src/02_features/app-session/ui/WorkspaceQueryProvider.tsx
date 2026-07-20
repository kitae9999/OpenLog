"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { AppBootstrap } from "@/features/app-session/model/appBootstrap";
import { appQueryKeys, workspaceQueryKeys } from "@/shared/api/queryKeys";

export function WorkspaceQueryProvider({
  bootstrap,
  children,
}: {
  bootstrap: AppBootstrap;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  useState(() => {
    queryClient.setQueryData(appQueryKeys.session, bootstrap.user);
    queryClient.setQueryData(appQueryKeys.workspaces, bootstrap.workspaces);
    queryClient.setQueryData(
      appQueryKeys.notificationSummary,
      bootstrap.notificationSummary,
    );
    if (bootstrap.activeWorkspaceId && bootstrap.navigationSummary) {
      queryClient.setQueryData(
        workspaceQueryKeys.navigation(bootstrap.activeWorkspaceId),
        bootstrap.navigationSummary,
      );
    }
    return true;
  });

  return children;
}
