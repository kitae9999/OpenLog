import { TaskEditFeed } from "@/pages/tasks/ui/TaskEditFeed";

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return <TaskEditFeed taskId={taskId} />;
}
