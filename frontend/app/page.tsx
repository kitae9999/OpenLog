import { HomeFeed } from "@/widgets/home-feed/ui";

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
  if (value === "home" || value === "following") {
    return value;
  }
  return "home";
}
