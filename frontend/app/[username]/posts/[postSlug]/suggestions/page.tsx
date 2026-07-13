import { notFound } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { AppChromeShell } from "@/widgets/home-feed/ui/AppChromeShell";
import { loadAppChromeWorkspace } from "@/widgets/home-feed/ui/loadAppChromeWorkspace";
import {
  PostSuggests,
  type SuggestionListItem,
  type SuggestionStatusFilter,
} from "@/widgets/post/ui";
import {
  type ApiSuggestionStatus,
  type ApiSuggestionSummary,
  getPostSuggestions,
} from "@/entities/post/api/getPostSuggestions";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getPostEntry } from "@/entities/post/model";
import { getUser } from "@/features/auth/api/getUser";
import { assets } from "@/shared/config/assets";
import { formatPostVersionLabel } from "@/shared/lib/postVersion";
import {
  buildPublicPostPath,
  buildPublicSuggestDetailPath,
  buildPublicSuggestNewPath,
  buildPublicSuggestsPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

export default async function PublicPostSuggestsPage({
  params,
  searchParams,
}: {
  params?: Promise<{ username?: string; postSlug?: string }>;
  searchParams?: Promise<{ status?: string | string[] }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const usernameParam = resolvedParams?.username;
  const postSlug = resolvedParams?.postSlug;
  const activeStatus = parseSuggestionStatusFilter(
    resolvedSearchParams?.status,
  );

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
  const chrome = await loadAppChromeWorkspace(!!viewer);

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const suggestsHref = buildPublicSuggestsPath(
    authorUsername,
    canonicalPostSlug,
  );
  const suggestEditHref = buildPublicSuggestNewPath(
    authorUsername,
    canonicalPostSlug,
  );

  if (detail) {
    const suggestions = await getPostSuggestions(detail.id);

    return (
      <AppChromeShell
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={
          viewer ? buildViewerProfileHref(viewer.username) : undefined
        }
        activeTab="home"
        workspaces={chrome.workspaces}
        workspaceData={chrome.workspaceData}
        footer={<Footer />}
      >
        <div className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
          <PostSuggests
            post={{
              title: detail.title,
              description: detail.description,
              authorName: detail.authorName,
              authorAvatarSrc: detail.authorAvatarSrc ?? assets.defaultAvatar,
              publishedAtLabel: detail.publishedAtLabel,
              versionLabel: formatPostVersionLabel(detail.version),
              tags: detail.topics,
              likes: detail.likes,
              liked: detail.liked,
              comments: detail.comments,
            }}
            suggestions={suggestions.map((suggestion, index, list) =>
              toSuggestionListItem(
                authorUsername,
                canonicalPostSlug,
                suggestion,
                index,
                list,
              ),
            )}
            backHref="/"
            articleHref={articleHref}
            suggestsHref={suggestsHref}
            suggestEditHref={suggestEditHref}
            suggestCount={suggestions.length}
            activeStatus={activeStatus}
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
      isLoggedIn={!!viewer}
      profileImageUrl={viewer?.profileImageUrl}
      profileHref={
        viewer ? buildViewerProfileHref(viewer.username) : undefined
      }
      activeTab="home"
      workspaces={chrome.workspaces}
      workspaceData={chrome.workspaceData}
      footer={<Footer />}
    >
      <div className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <PostSuggests
          post={entry.post}
          suggestions={entry.suggestions}
          backHref="/"
          articleHref={articleHref}
          suggestsHref={suggestsHref}
          suggestEditHref={suggestEditHref}
          suggestCount={entry.suggestCount}
          activeStatus={activeStatus}
        />
      </div>
    </AppChromeShell>
  );
}

function parseSuggestionStatusFilter(
  status?: string | string[],
): SuggestionStatusFilter {
  const value = Array.isArray(status) ? status[0] : status;
  return value === "closed" ? "closed" : "open";
}

function toSuggestionListItem(
  authorUsername: string,
  canonicalPostSlug: string,
  suggestion: ApiSuggestionSummary,
  index: number,
  list: ApiSuggestionSummary[],
): SuggestionListItem {
  const displayNumber = String(list.length - index);

  return {
    id: String(suggestion.id),
    detailHref: buildPublicSuggestDetailPath(
      authorUsername,
      canonicalPostSlug,
      displayNumber,
    ),
    numberLabel: `#${displayNumber}`,
    title: suggestion.title,
    activityLabel: buildSuggestionActivityLabel(
      suggestion.status,
      formatDateLabel(
        suggestion.status === "OPEN"
          ? suggestion.createdAt
          : suggestion.updatedAt,
      ),
    ),
    authorName: suggestion.authorName,
    commentCount: suggestion.commentCount,
    status: toSuggestionListStatus(suggestion.status),
  };
}

function buildSuggestionActivityLabel(
  status: ApiSuggestionStatus,
  dateLabel: string,
) {
  if (status === "OPEN") {
    return `opened ${dateLabel}`;
  }

  if (status === "OUTDATED") {
    return `marked outdated ${dateLabel}`;
  }

  if (status === "MERGED") {
    return `accepted ${dateLabel}`;
  }

  if (status === "REJECTED") {
    return `rejected ${dateLabel}`;
  }

  return `closed ${dateLabel}`;
}

function toSuggestionListStatus(
  status: ApiSuggestionStatus,
): SuggestionListItem["status"] {
  if (status === "OPEN") {
    return "open";
  }

  if (status === "OUTDATED") {
    return "outdated";
  }

  if (status === "MERGED") {
    return "merged";
  }

  if (status === "REJECTED") {
    return "rejected";
  }

  return "closed";
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}
