import { ActivityFeed } from "@/widgets/home-feed/ui/ActivityFeed";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  return <ActivityFeed requestedDate={date} />;
}
