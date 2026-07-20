import { WorkspaceMemoryEditorQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function MemoryDetailPage({ params }: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await params;
  return <WorkspaceMemoryEditorQueryView mode="detail" memoryId={memoryId} />;
}
