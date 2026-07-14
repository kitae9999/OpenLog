import { PlannerFeed } from "@/pages/planner/ui/PlannerFeed";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const { month, date } = await searchParams;
  return <PlannerFeed requestedMonth={month} requestedDate={date} />;
}
