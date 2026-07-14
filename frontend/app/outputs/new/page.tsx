import { OutputCreateFeed } from "@/pages/outputs/ui/OutputCreateFeed";

export default async function NewOutputPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const params = await searchParams;

  return <OutputCreateFeed taskId={params.taskId} />;
}
