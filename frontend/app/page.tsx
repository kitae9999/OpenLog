import { HomeFeed } from "@/widgets/home-feed/ui/HomeFeed";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>; // 객체 구조 분해할당, searchParams는 Next가 자동으로 넘겨줌
}) {
  const sp = await searchParams;
  const tab = normalizeTab(sp?.tab);
  return <HomeFeed activeTab={tab} />;
}

function normalizeTab(value: string | undefined) {
  if (value === "latest" || value === "following" || value === "trending") {
    return value;
  }
  return "trending";
}
