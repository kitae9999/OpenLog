import { WorkspaceMemoryEditorQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function EditMemoryPage({ params }: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await params;
  return <WorkspaceMemoryEditorQueryView mode="edit" memoryId={memoryId} />;
}
