import { WorkspaceOutputCreateQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function NewOutputPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const params = await searchParams;

  return <WorkspaceOutputCreateQueryView taskId={params.taskId} />;
}
