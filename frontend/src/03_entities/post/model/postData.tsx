import type { ReactNode } from "react";
import { assets } from "@/shared/config/assets";

export type Contributor = {
  name: string;
  role: string;
  avatarSrc: string;
};

export type Post = {
  title: string;
  description?: string;
  authorName: string;
  authorAvatarSrc: string;
  publishedAtLabel: string;
  readTimeLabel: string;
  tags: string[];
  coverSrc: string;
  likes: number;
  liked?: boolean;
  comments: number;
};

export type Reviewer = {
  name: string;
  avatarSrc: string;
  status?: "approved";
};

export type SuggestionComment = {
  authorName: string;
  authorAvatarSrc: string;
  commentedAtLabel: string;
  message: string;
};

export type DiscussionComment = {
  id: string;
  authorName: string;
  authorAvatarSrc: string;
  commentedAtLabel: string;
  message: string;
};

export type DiffRow = {
  oldLine?: number;
  newLine?: number;
  kind: "context" | "remove" | "add";
  content: string;
};

export type Suggestion = {
  id: string;
  numberLabel: string;
  title: string;
  openedAtLabel: string;
  authorName: string;
  authorAvatarSrc: string;
  commentCount: number;
  status: "open" | "closed" | "merged";
  targetBranch: string;
  sourceBranch: string;
  comment: SuggestionComment;
  reviewers: Reviewer[];
  diffRows: DiffRow[];
  resolutionNote?: {
    title: string;
    description: string;
  };
  discussionComments: DiscussionComment[];
};

export type PostEntry = {
  post: Post;
  body?: ReactNode;
  suggestCount?: number;
  suggestions: Suggestion[];
};

export const contributors: Contributor[] = [
  {
    name: "Kent C. Dodds",
    role: "Software Engineer and Educator.",
    avatarSrc: assets.avatarA,
  },
  {
    name: "Dan Abramov",
    role: "React Core Team.",
    avatarSrc: assets.avatarB,
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

const postEntries: Record<string, Record<string, PostEntry>> = {
  kentcdodds: {
    "tailwind-v4": {
    post: {
      title: "The Future of CSS: Tailwind v4",
      authorName: "Kent C. Dodds",
      authorAvatarSrc: assets.avatarA,
      publishedAtLabel: "2026. 2. 25.",
      readTimeLabel: "5 min read",
      tags: ["CSS", "Tooling"],
      coverSrc: assets.postCover,
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
        authorAvatarSrc: assets.avatarA,
        commentCount: 2,
        status: "open",
        targetBranch: "master",
        sourceBranch: "patch-1",
        comment: {
          authorName: "Kent C. Dodds",
          authorAvatarSrc: assets.avatarA,
          commentedAtLabel: "2026. 3. 11.",
          message:
            "I rewrote the upgrade note so the token migration reads as truly zero-config in the common case, while keeping the edge-case caveat.",
        },
        reviewers: [
          {
            name: "Sarah Drasner",
            avatarSrc: assets.avatarB,
          },
        ],
        diffRows: [
          {
            oldLine: 12,
            newLine: 12,
            kind: "context",
            content: "## Migrating design tokens",
          },
          {
            oldLine: 13,
            newLine: 13,
            kind: "context",
            content: "",
          },
          {
            oldLine: 14,
            kind: "remove",
            content:
              "Tailwind v4 still requires a manual theme migration for most projects.",
          },
          {
            oldLine: 15,
            kind: "remove",
            content:
              "Plan to map every token by hand before you enable the new engine.",
          },
          {
            newLine: 14,
            kind: "add",
            content:
              "Tailwind v4 can infer most theme tokens automatically when your config already follows common conventions.",
          },
          {
            newLine: 15,
            kind: "add",
            content:
              "Only projects with heavily customized token pipelines need a manual mapping step.",
          },
        ],
        discussionComments: [],
      },
      {
        id: "pr2",
        numberLabel: "#pr2",
        title: "Close outdated note about PostCSS setup",
        openedAtLabel: "2026. 3. 9.",
        authorName: "Dan Abramov",
        authorAvatarSrc: assets.avatarB,
        commentCount: 1,
        status: "closed",
        targetBranch: "master",
        sourceBranch: "cleanup-postcss-note",
        comment: {
          authorName: "Dan Abramov",
          authorAvatarSrc: assets.avatarB,
          commentedAtLabel: "2026. 3. 9.",
          message:
            "This removes the old PostCSS warning and keeps the setup guide aligned with the current default toolchain.",
        },
        reviewers: [
          {
            name: "Kent C. Dodds",
            avatarSrc: assets.avatarA,
          },
        ],
        diffRows: [
          {
            oldLine: 21,
            newLine: 21,
            kind: "context",
            content: "## Tooling updates",
          },
          {
            oldLine: 22,
            kind: "remove",
            content: "Projects must install a custom PostCSS bridge to compile.",
          },
          {
            newLine: 22,
            kind: "add",
            content: "The default PostCSS integration is already included.",
          },
        ],
        discussionComments: [],
      },
    ],
    },
  },
  sdrasner: {
    "understanding-react-server-components": {
      post: {
        title: "Understanding React Server Components",
        authorName: "Sarah Drasner",
        authorAvatarSrc: assets.avatarB,
        publishedAtLabel: "2026. 2. 28.",
        readTimeLabel: "8 min read",
        tags: ["React", "Web Development", "Performance"],
        coverSrc: assets.featuredCover,
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
          authorAvatarSrc: assets.avatarA,
          commentCount: 0,
          status: "open",
          targetBranch: "master",
          sourceBranch: "patch-1",
          comment: {
            authorName: "Kent C. Dodds",
            authorAvatarSrc: assets.avatarA,
            commentedAtLabel: "2026. 3. 11.",
            message:
              "I clarified the section on bundle size to mention dependencies, and fixed a minor phrasing issue.",
          },
          reviewers: [
            {
              name: "Sarah Drasner",
              avatarSrc: assets.avatarB,
            },
          ],
          diffRows: [
            {
              oldLine: 1,
              newLine: 1,
              kind: "context",
              content: "## Enter Server Components",
            },
            {
              oldLine: 2,
              newLine: 2,
              kind: "context",
              content: "",
            },
            {
              oldLine: 3,
              kind: "remove",
              content:
                "Server Components allow us to render components exclusively on the server. This means:",
            },
            {
              oldLine: 4,
              kind: "remove",
              content:
                "1. **Zero Bundle Size:** The component's code is never sent to the client.",
            },
            {
              oldLine: 5,
              kind: "remove",
              content:
                "2. **Direct Backend Access:** Server Components can query the database directly.",
            },
            {
              newLine: 3,
              kind: "add",
              content:
                "Server Components allow us to render components exclusively on the server. This brings significant benefits:",
            },
            {
              newLine: 4,
              kind: "add",
              content:
                "1. **Zero Bundle Size:** The component's code (and its dependencies) is never sent to the client.",
            },
            {
              newLine: 5,
              kind: "add",
              content:
                "2. **Direct Backend Access:** Server Components can query the database directly without an API layer.",
            },
          ],
          discussionComments: [],
        },
        {
          id: "pr2",
          numberLabel: "#pr2",
          title: "Add comment explaining Server component boundaries",
          openedAtLabel: "2026. 3. 10.",
          authorName: "Dan Abramov",
          authorAvatarSrc: assets.avatarB,
          commentCount: 0,
          status: "merged",
          targetBranch: "master",
          sourceBranch: "patch-1",
          comment: {
            authorName: "Dan Abramov",
            authorAvatarSrc: assets.avatarB,
            commentedAtLabel: "2026. 3. 10.",
            message:
              "Added a useful comment above the code block to help beginners understand context.",
          },
          reviewers: [
            {
              name: "Sarah Drasner",
              avatarSrc: assets.avatarB,
              status: "approved",
            },
          ],
          diffRows: [
            {
              oldLine: 1,
              newLine: 1,
              kind: "context",
              content: "### Code Example",
            },
            {
              oldLine: 2,
              newLine: 2,
              kind: "context",
              content: "",
            },
            {
              oldLine: 3,
              newLine: 3,
              kind: "context",
              content: "```jsx",
            },
            {
              oldLine: 4,
              kind: "remove",
              content: "// Note: This component runs on the server!",
            },
            {
              newLine: 4,
              kind: "add",
              content: "// Note: This component runs entirely on the server!",
            },
            {
              newLine: 5,
              kind: "add",
              content: "// It doesn't add any bytes to the client JS bundle.",
            },
            {
              oldLine: 5,
              newLine: 6,
              kind: "context",
              content: "import db from './db';",
            },
          ],
          resolutionNote: {
            title: "Pull request successfully merged and closed",
            description:
              "The author accepted these changes. The original post has been updated.",
          },
          discussionComments: [],
        },
      ],
    },
  },
};

export function getPostEntry(authorUsername: string, slug: string) {
  return postEntries[authorUsername]?.[slug];
}

export function getSuggestion(
  authorUsername: string,
  slug: string,
  suggestionId: string,
) {
  return postEntries[authorUsername]?.[slug]?.suggestions.find(
    (suggestion) => suggestion.id === suggestionId,
  );
}
