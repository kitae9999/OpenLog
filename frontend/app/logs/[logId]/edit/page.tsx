import { LogEditFeed } from "@/widgets/home-feed/ui/LogEditFeed";

export default async function LogEditPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;

  return <LogEditFeed logId={logId} />;
}
