import { notFound } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { getLogById } from "@/entities/workspace/model/data";
import { LogDetailShell } from "@/pages/logs/ui/LogDetailShell";
import { requireWorkspaceData } from "@/widgets/app-shell/lib/requireWorkspacePageData";
import {
  getWorkspaceLog,
  loadWorkspacePageData,
} from "@/entities/workspace/api/workspaceApi";

export async function LogDetailFeed({
  logId,
  viewer,
}: {
  logId: string;
  viewer?: User | null;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const pageData = user
    ? await loadWorkspacePageData()
    : { workspaces: [], workspaceData: null, status: "empty" as const };
  const workspaces = pageData.workspaces;
  const workspaceData = user ? requireWorkspaceData(pageData) : null;
  const log = workspaceData
    ? await getWorkspaceLog(workspaceData.workspaceId, logId)
    : getLogById(logId);

  if (!log) {
    notFound();
  }

  return (
    <LogDetailShell
      logId={logId}
      log={log}
      workspaces={workspaces}
      workspaceData={workspaceData}
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
