import { WorkspaceOutputQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function OutputDetailPage({
  params,
}: {
  params: Promise<{ outputId: string }>;
}) {
  const { outputId } = await params;

  return <WorkspaceOutputQueryView outputId={outputId} />;
}
