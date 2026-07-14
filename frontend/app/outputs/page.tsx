import { OutputsListFeed } from "@/pages/outputs/ui/OutputsListFeed";
import type { WorkspaceOutputStatus } from "@/entities/workspace/model/data";

const allowedStatuses: WorkspaceOutputStatus[] = ["draft", "published"];

export default async function OutputsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = allowedStatuses.includes(params.status as WorkspaceOutputStatus)
    ? (params.status as WorkspaceOutputStatus)
    : "draft";

  return <OutputsListFeed status={status} />;
}
