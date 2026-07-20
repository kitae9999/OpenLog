"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 30 * 60_000,
          retry: 1,
          refetchOnWindowFocus: true,
        },
        mutations: {
          retry: 0,
        },
      },
    });
    client.setQueryData(appQueryKeys.session, bootstrap.user);
    client.setQueryData(appQueryKeys.workspaces, bootstrap.workspaces);
    client.setQueryData(
      appQueryKeys.notificationSummary,
      bootstrap.notificationSummary,
    );
    if (bootstrap.activeWorkspaceId && bootstrap.navigationSummary) {
      client.setQueryData(
        workspaceQueryKeys.navigation(bootstrap.activeWorkspaceId),
        bootstrap.navigationSummary,
      );
    }
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
