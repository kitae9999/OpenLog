import { WorkspacePlannerQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const { month, date } = await searchParams;
  return <WorkspacePlannerQueryView requestedMonth={month} requestedDate={date} />;
}
