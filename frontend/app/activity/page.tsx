import { ActivityFeed } from "@/pages/activity/ui/ActivityFeed";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  return <ActivityFeed requestedDate={date} />;
}
