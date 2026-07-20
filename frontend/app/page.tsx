import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { HomeFeed } from "@/pages/home/ui";
import { LandingPage } from "@/widgets/landing/ui";
import { getDefaultTab, type TabKey } from "@/entities/workspace/model/data";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/shared/config/site";
import { toJsonLdScript } from "@/shared/lib/jsonLd";
import { parseLandingLocale } from "@/widgets/landing/model/landingContent";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  if (sp?.tab) {
    return {
      alternates: { canonical: "/" },
      robots: { index: false, follow: true },
    };
  }

  return {};
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    tab?: string;
    status?: string;
    lang?: string | string[];
  }>; // 객체 구조 분해할당, searchParams는 Next가 자동으로 넘겨줌
}) {
  const sp = await searchParams;
  const user = await getUserOrRedirectToOnboarding();
  const isLoggedIn = !!user;
  if (isLoggedIn && (!sp?.tab || sp.tab === "workspace")) {
    redirect("/dashboard");
  }
  const tab = normalizeTab(sp?.tab, isLoggedIn);
  const langParam = sp?.lang;
  const lang = Array.isArray(langParam) ? langParam[0] : langParam;
  const landingLocale = parseLandingLocale(lang);

  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: landingLocale === "ko" ? "ko" : "en",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
    ],
  };

  const content =
    !isLoggedIn && !sp?.tab ? (
      <LandingPage locale={landingLocale} />
    ) : (
      <HomeFeed
        activeTab={tab}
        activePostStatus={sp?.status === "drafts" ? "drafts" : "published"}
        viewer={user}
      />
    );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(siteJsonLd) }}
      />
      {content}
    </>
  );
}

function normalizeTab(value: string | undefined, isLoggedIn: boolean): TabKey {
  if (
    value === "workspace" ||
    value === "explore" ||
    value === "home" ||
    value === "following" ||
    value === "liked"
  ) {
    return value;
  }

  return getDefaultTab(isLoggedIn);
}
