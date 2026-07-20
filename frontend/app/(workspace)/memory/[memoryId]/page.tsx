import { MemoryFeed } from "@/pages/memory/ui/MemoryFeed";

export default async function MemoryDetailPage({ params }: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await params;
  return <MemoryFeed mode="detail" memoryId={memoryId} />;
}
