import type { Metadata } from "next";
import { WorkspaceAgentSettingsFeed } from "@/pages/workspace-agent/ui/WorkspaceAgentSettingsFeed";

export const metadata: Metadata = {
  title: "Agent Guide | OpenLog",
  description: "Edit a workspace Agent Guide and project Capture Modes.",
};

export default async function WorkspaceAgentSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceAgentSettingsFeed workspaceId={workspaceId} />;
}
