import { WorkspaceTaskQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return <WorkspaceTaskQueryView taskId={taskId} mode="detail" />;
}
