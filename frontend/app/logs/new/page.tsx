import { LogCreateFeed } from "@/pages/logs/ui/LogCreateFeed";

export default async function NewLogPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const params = await searchParams;

  return <LogCreateFeed taskId={params.taskId} />;
}
