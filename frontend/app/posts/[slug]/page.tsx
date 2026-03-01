import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  OpenLogFooter,
  OpenLogHeader,
  openLogAssets,
} from "../../_components/openlog/OpenLogChrome";
import type {
  OpenLogContributor,
  OpenLogPost,
} from "../../_components/openlog/OpenLogPostArticle";
import { OpenLogPostArticle } from "../../_components/openlog/OpenLogPostArticle";

const contributors: OpenLogContributor[] = [
  {
    name: "Kent C. Dodds",
    role: "Software Engineer and Educator.",
    avatarSrc: openLogAssets.avatarA,
  },
  {
    name: "Dan Abramov",
    role: "React Core Team.",
    avatarSrc: openLogAssets.avatarB,
  },
];

const tailwindBody = (
  <div className="mt-8 space-y-6 text-[14px] leading-[1.65] text-zinc-700">
    <h2 className="text-[22px] font-semibold tracking-tight text-zinc-950">
      The Future of CSS: Tailwind v4
    </h2>
    <p>
      Tailwind v4 changes the engine under the hood and focuses on better
      performance and a simpler configuration story. Here&apos;s a quick tour of
      what to look for when upgrading.
    </p>
    <h3 className="text-[18px] font-semibold tracking-tight text-zinc-950">
      What&apos;s New
    </h3>
    <ul className="list-disc space-y-2 pl-6">
      <li>Faster builds with a revamped pipeline.</li>
      <li>Cleaner defaults and less boilerplate.</li>
      <li>Better DX for design tokens and theming.</li>
    </ul>
    <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-[12px] leading-5 text-zinc-900">
      <code>{`/* Example: keep your utility usage expressive */
.card {
  @apply rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm;
}`}</code>
    </pre>
  </div>
);

const postBySlug: Record<string, { post: OpenLogPost; body?: ReactNode }> = {
  "tailwind-v4": {
    post: {
      title: "The Future of CSS: Tailwind v4",
      authorName: "Kent C. Dodds",
      authorAvatarSrc: openLogAssets.avatarA,
      publishedAtLabel: "2026. 2. 25.",
      readTimeLabel: "5 min read",
      tags: ["CSS", "Tooling"],
      coverSrc: openLogAssets.postCover,
      likes: 890,
      comments: 12,
    },
    body: tailwindBody,
  },
  "understanding-react-server-components": {
    post: {
      title: "Understanding React Server Components",
      authorName: "Sarah Drasner",
      authorAvatarSrc: openLogAssets.avatarB,
      publishedAtLabel: "2026. 2. 28.",
      readTimeLabel: "8 min read",
      tags: ["React", "Web Development", "Performance"],
      coverSrc: openLogAssets.featuredCover,
      likes: 1240,
      comments: 24,
    },
  },
};

export default async function PostPage({
  params,
}: {
  params?: Promise<{ slug?: string | string[] }>;
}) {
  const p = await params;
  const slugParam = p?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) notFound();

  const entry = postBySlug[slug];
  if (!entry) notFound();

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <OpenLogHeader />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <OpenLogPostArticle
          post={entry.post}
          contributors={contributors}
          backHref="/?tab=trending"
          suggestEditsHref="/contribute"
        >
          {entry.body}
        </OpenLogPostArticle>
      </main>

      <OpenLogFooter />
    </div>
  );
}
