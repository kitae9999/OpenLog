import { clientApi } from "@/shared/api/clientApi";
import {
  mapAppBootstrap,
  type AppBootstrap,
  type AppBootstrapResponse,
  type NotificationSummary,
} from "@/features/app-session/model/appBootstrap";

export async function fetchAppBootstrap(
  workspaceId?: string | null,
): Promise<AppBootstrap> {
  const params = new URLSearchParams();
  if (workspaceId) {
    params.set("workspaceId", workspaceId);
  }
  const query = params.size > 0 ? `?${params}` : "";
  const response = await clientApi<AppBootstrapResponse>(
    `/api/app/bootstrap${query}`,
  );
  return mapAppBootstrap(response);
}

export function fetchNotificationSummary() {
  return clientApi<NotificationSummary>("/api/notifications/summary");
}
