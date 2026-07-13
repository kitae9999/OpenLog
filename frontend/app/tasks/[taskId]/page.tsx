import { TaskDetailFeed } from "@/widgets/home-feed/ui/TaskDetailFeed";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return <TaskDetailFeed taskId={taskId} />;
}
