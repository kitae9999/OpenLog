import { WorkspaceActivityQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  return <WorkspaceActivityQueryView requestedDate={date} />;
}
