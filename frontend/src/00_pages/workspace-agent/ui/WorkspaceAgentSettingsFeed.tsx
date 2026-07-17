import { notFound, redirect } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { listManagedWorkspaces } from "@/entities/workspace/api/workspaceApi";
import { getWorkspaceAgentSettings } from "@/entities/workspace/api/workspaceAgentApi";
import { WorkspaceAgentSettingsShell } from "@/pages/workspace-agent/ui/WorkspaceAgentSettingsShell";
import {
  parseAgentGuidePageLocale,
  type AgentGuidePageLocale,
} from "@/pages/workspace-agent/model/agentGuidePageContent";

export async function WorkspaceAgentSettingsFeed({
  workspaceId,
  locale: localeParam,
}: {
  workspaceId: string;
  locale?: string | null;
}) {
  const locale: AgentGuidePageLocale = parseAgentGuidePageLocale(localeParam);
  const user = await getUserOrRedirectToOnboarding();
  if (!user) {
    redirect("/");
  }

  const [workspaces, data] = await Promise.all([
    listManagedWorkspaces(),
    getWorkspaceAgentSettings(workspaceId),
  ]);
  if (!data) {
    notFound();
  }

  return (
    <WorkspaceAgentSettingsShell
      profileImageUrl={user.profileImageUrl}
      profileHref={buildViewerProfileHref(user.username)}
      workspaces={workspaces}
      data={data}
      locale={locale}
      footer={<Footer />}
    />
  );
}
