import { WorkspaceLogCreateQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function NewLogPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const params = await searchParams;

  return <WorkspaceLogCreateQueryView taskId={params.taskId} />;
}
