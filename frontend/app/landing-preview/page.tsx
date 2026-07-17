import { LandingPage } from "@/widgets/landing/ui";
import { parseLandingLocale } from "@/widgets/landing/model/landingContent";

export default async function LandingPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await searchParams;
  const langParam = resolved?.lang;
  const lang = Array.isArray(langParam) ? langParam[0] : langParam;

  return <LandingPage locale={parseLandingLocale(lang)} />;
}
