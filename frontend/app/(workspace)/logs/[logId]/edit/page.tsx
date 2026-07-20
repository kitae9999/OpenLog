import { WorkspaceLogQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function LogEditPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;

  return <WorkspaceLogQueryView logId={logId} mode="edit" />;
}
