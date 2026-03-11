import type { ReactNode } from "react";
import type {
  OpenLogContributor,
  OpenLogPost,
} from "./OpenLogPostArticle";
import { openLogAssets } from "./OpenLogChrome";

export type OpenLogSuggestion = {
  id: string;
  numberLabel: string;
  title: string;
  openedAtLabel: string;
  authorName: string;
  commentCount: number;
  status: "open" | "closed";
};

export type OpenLogPostEntry = {
  post: OpenLogPost;
  body?: ReactNode;
  suggestCount?: number;
  suggestions: OpenLogSuggestion[];
};

export const openLogContributors: OpenLogContributor[] = [
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

const openLogPostEntries: Record<string, OpenLogPostEntry> = {
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
    suggestCount: 1,
    suggestions: [
      {
        id: "pr1",
        numberLabel: "#pr1",
        title: "Clarify zero-config theme token migration",
        openedAtLabel: "2026. 3. 11.",
        authorName: "Kent C. Dodds",
        commentCount: 2,
        status: "open",
      },
      {
        id: "pr2",
        numberLabel: "#pr2",
        title: "Close outdated note about PostCSS setup",
        openedAtLabel: "2026. 3. 9.",
        authorName: "Dan Abramov",
        commentCount: 1,
        status: "closed",
      },
    ],
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
    suggestCount: 1,
    suggestions: [
      {
        id: "pr1",
        numberLabel: "#pr1",
        title: "Fix typo and clarify bundle size section",
        openedAtLabel: "2026. 3. 11.",
        authorName: "Kent C. Dodds",
        commentCount: 0,
        status: "open",
      },
      {
        id: "pr2",
        numberLabel: "#pr2",
        title: "Add comment explaining Server component boundaries",
        openedAtLabel: "2026. 3. 10.",
        authorName: "Dan Abramov",
        commentCount: 0,
        status: "closed",
      },
    ],
  },
};

export function getOpenLogPostEntry(slug: string) {
  return openLogPostEntries[slug];
}
