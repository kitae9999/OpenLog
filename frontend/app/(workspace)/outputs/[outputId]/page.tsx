import { OutputDetailFeed } from "@/pages/outputs/ui/OutputDetailFeed";

export default async function OutputDetailPage({
  params,
}: {
  params: Promise<{ outputId: string }>;
}) {
  const { outputId } = await params;

  return <OutputDetailFeed outputId={outputId} />;
}
