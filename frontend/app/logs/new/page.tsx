import { LogCreateFeed } from "@/widgets/home-feed/ui/LogCreateFeed";

export default async function NewLogPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const params = await searchParams;

  return <LogCreateFeed taskId={params.taskId} />;
}
