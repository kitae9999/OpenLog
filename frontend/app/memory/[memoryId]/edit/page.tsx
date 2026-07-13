import { MemoryFeed } from "@/widgets/home-feed/ui/MemoryFeed";

export default async function EditMemoryPage({ params }: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await params;
  return <MemoryFeed mode="edit" memoryId={memoryId} />;
}
