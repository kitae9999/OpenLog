import { TaskDetailFeed } from "@/pages/tasks/ui/TaskDetailFeed";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return <TaskDetailFeed taskId={taskId} />;
}
