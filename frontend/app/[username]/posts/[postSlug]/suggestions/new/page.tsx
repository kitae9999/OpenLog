import { notFound, redirect } from "next/navigation";
import { Children, isValidElement, type ReactNode } from "react";
import { Footer } from "@/widgets/chrome/ui";
import { AppChromeShell } from "@/widgets/app-shell/ui/AppChromeShell";
import { loadAppChromeWorkspace } from "@/widgets/app-shell/api/loadAppChromeWorkspace";
import { NewSuggestionView } from "@/widgets/post/ui";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getPostEntry } from "@/entities/post/model";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
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
    getUserOrRedirectToOnboarding(),
    getPostDetail(authorUsername, canonicalPostSlug),
  ]);

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const suggestsHref = buildPublicSuggestsPath(authorUsername, canonicalPostSlug);

  if (!viewer) {
    redirect(suggestsHref);
  }

  const chrome = await loadAppChromeWorkspace(true);

  if (detail) {
    const action = createPostSuggestionAction.bind(
      null,
      detail.id,
      suggestsHref,
    );

    return (
      <AppChromeShell
        isLoggedIn={true}
        profileImageUrl={viewer.profileImageUrl}
        profileHref={buildViewerProfileHref(viewer.username)}
        activeTab="home"
        workspaces={chrome.workspaces}
        workspaceData={chrome.workspaceData}
        footer={<Footer />}
      >
        <div className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
          <NewSuggestionView
            initialValues={{
              postTitle: detail.title,
              baseContent: detail.content,
            }}
            backHref={suggestsHref}
            articleHref={articleHref}
            action={action}
          />
        </div>
      </AppChromeShell>
    );
  }

  const entry = getPostEntry(authorUsername, canonicalPostSlug);
  if (!entry) {
    notFound();
  }

  return (
    <AppChromeShell
      isLoggedIn={true}
      profileImageUrl={viewer.profileImageUrl}
      profileHref={buildViewerProfileHref(viewer.username)}
      activeTab="home"
      workspaces={chrome.workspaces}
      workspaceData={chrome.workspaceData}
      footer={<Footer />}
    >
      <div className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <NewSuggestionView
          initialValues={{
            postTitle: entry.post.title,
            baseContent: extractMarkdownText(entry.body),
          }}
          backHref={suggestsHref}
          articleHref={articleHref}
        />
      </div>
    </AppChromeShell>
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
