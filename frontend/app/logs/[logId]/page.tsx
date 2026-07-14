import { LogDetailFeed } from "@/pages/logs/ui/LogDetailFeed";

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;

  return <LogDetailFeed logId={logId} />;
}
