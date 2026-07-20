import { WorkspaceOutputsQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";
import type { WorkspaceOutputStatus } from "@/entities/workspace/model/data";

const allowedStatuses: WorkspaceOutputStatus[] = ["draft", "exported"];

export default async function OutputsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = allowedStatuses.includes(params.status as WorkspaceOutputStatus)
    ? (params.status as WorkspaceOutputStatus)
    : "draft";

  return <WorkspaceOutputsQueryView status={status} />;
}
