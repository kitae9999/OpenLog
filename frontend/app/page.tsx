import { OpenLogMain } from "./_components/openlog/OpenLogMain";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = normalizeTab(sp?.tab);
  return <OpenLogMain activeTab={tab} />;
}

function normalizeTab(value: string | undefined) {
  if (value === "latest" || value === "following" || value === "trending") {
    return value;
  }
  return "trending";
}
