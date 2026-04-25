import { notFound } from "next/navigation";
import { Children, isValidElement, type ReactNode } from "react";
import { Footer, Header } from "@/widgets/chrome/ui";
import { NewSuggestionView } from "@/widgets/post/ui";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getPostEntry } from "@/entities/post/model";
import { getUser } from "@/features/auth/api/getUser";
import { createPostSuggestionAction } from "@/features/suggest/api/suggestionActions";
import {
  buildPublicPostPath,
  buildPublicSuggestsPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

export default async function NewSuggestionPage({
  params,
}: {
  params?: Promise<{ username?: string; postSlug?: string }>;
}) {
  const resolvedParams = await params;
  const usernameParam = resolvedParams?.username;
  const postSlug = resolvedParams?.postSlug;

  if (!usernameParam || !postSlug) {
    notFound();
  }

  const authorUsername = parsePublicUsernameParam(usernameParam);
  const canonicalPostSlug = parsePublicPostSlugParam(postSlug);
  if (!authorUsername || !canonicalPostSlug) {
    notFound();
  }

  const [viewer, detail] = await Promise.all([
    getUser(),
    getPostDetail(authorUsername, canonicalPostSlug),
  ]);

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const suggestsHref = buildPublicSuggestsPath(authorUsername, canonicalPostSlug);

  if (detail) {
    const action = createPostSuggestionAction.bind(
      null,
      detail.id,
      suggestsHref,
    );

    return (
      <div className="min-h-dvh bg-zinc-50 text-zinc-950">
        <Header
          isLoggedIn={!!viewer}
          profileImageUrl={viewer?.profileImageUrl}
          profileHref={viewer ? buildViewerProfileHref(viewer.username) : undefined}
        />

        <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
          <NewSuggestionView
            initialValues={{
              postTitle: detail.title,
              originalContent: detail.content,
            }}
            backHref={suggestsHref}
            articleHref={articleHref}
            action={action}
          />
        </main>

        <Footer />
      </div>
    );
  }

  const entry = getPostEntry(authorUsername, canonicalPostSlug);
  if (!entry) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={viewer ? buildViewerProfileHref(viewer.username) : undefined}
      />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <NewSuggestionView
          initialValues={{
            postTitle: entry.post.title,
            originalContent: extractMarkdownText(entry.body),
          }}
          backHref={suggestsHref}
          articleHref={articleHref}
        />
      </main>

      <Footer />
    </div>
  );
}

function extractMarkdownText(value: ReactNode): string {
  if (value == null || typeof value === "boolean") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return normalizeBlocks(value.map(extractMarkdownText));
  }

  if (!isValidElement<{ children?: ReactNode }>(value)) {
    return "";
  }

  const elementType = value.type;
  const children = Children.toArray(value.props.children);
  const childText = normalizeBlocks(children.map(extractMarkdownText));

  if (typeof elementType !== "string") {
    return childText;
  }

  switch (elementType) {
    case "h1":
      return `# ${childText}`;
    case "h2":
      return `## ${childText}`;
    case "h3":
      return `### ${childText}`;
    case "h4":
      return `#### ${childText}`;
    case "li":
      return `- ${childText}`;
    case "pre":
      return `\`\`\`\n${childText}\n\`\`\``;
    case "code":
      return childText;
    case "p":
    case "ul":
    case "ol":
    case "div":
    default:
      return childText;
  }
}

function normalizeBlocks(blocks: string[]) {
  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .join("\n\n");
}
