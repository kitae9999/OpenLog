import type { Metadata } from "next";
import { WorkspaceAgentSettingsQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export const metadata: Metadata = {
  title: "Agent Guide | OpenLog",
  description: "Edit a workspace Agent Guide and project Capture Modes.",
};

export default async function WorkspaceAgentSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
}) {
  const { workspaceId } = await params;
  const resolved = await searchParams;
  const langParam = resolved?.lang;
  const lang = Array.isArray(langParam) ? langParam[0] : langParam;

  return (
    <WorkspaceAgentSettingsQueryView workspaceId={workspaceId} locale={lang ?? null} />
  );
}
