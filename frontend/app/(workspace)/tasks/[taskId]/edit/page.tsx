import { WorkspaceTaskQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return <WorkspaceTaskQueryView taskId={taskId} mode="edit" />;
}
