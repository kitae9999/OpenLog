import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
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
import {
  buildPublicPostPath,
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

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const suggestsHref = buildPublicSuggestsPath(authorUsername, canonicalPostSlug);
  const suggestEditHref = buildPublicSuggestNewPath(
    authorUsername,
    canonicalPostSlug,
  );

  if (detail) {
    const suggestions = await getPostSuggestions(detail.id);

    return (
      <div className="min-h-dvh bg-white text-zinc-950">
        <Header
          isLoggedIn={!!viewer}
          profileImageUrl={viewer?.profileImageUrl}
          profileHref={viewer ? buildViewerProfileHref(viewer.username) : undefined}
        />

        <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
          <PostSuggests
            post={{
              title: detail.title,
              description: detail.description,
              authorName: detail.authorName,
              authorAvatarSrc: detail.authorAvatarSrc ?? assets.defaultAvatar,
              publishedAtLabel: detail.publishedAtLabel,
              tags: detail.topics,
              coverSrc: assets.postCover,
              likes: detail.likes,
              liked: detail.liked,
              comments: detail.comments,
            }}
            suggestions={suggestions.map(toSuggestionListItem)}
            backHref="/?tab=trending"
            articleHref={articleHref}
            suggestsHref={suggestsHref}
            suggestEditHref={suggestEditHref}
            suggestCount={suggestions.length}
            activeStatus={activeStatus}
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
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={viewer ? buildViewerProfileHref(viewer.username) : undefined}
      />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <PostSuggests
          post={entry.post}
          suggestions={entry.suggestions}
          backHref="/?tab=trending"
          articleHref={articleHref}
          suggestsHref={suggestsHref}
          suggestEditHref={suggestEditHref}
          suggestCount={entry.suggestCount}
          activeStatus={activeStatus}
        />
      </main>

      <Footer />
    </div>
  );
}

function parseSuggestionStatusFilter(
  status?: string | string[],
): SuggestionStatusFilter {
  const value = Array.isArray(status) ? status[0] : status;
  return value === "closed" ? "closed" : "open";
}

function toSuggestionListItem(
  suggestion: ApiSuggestionSummary,
  index: number,
  list: ApiSuggestionSummary[],
): SuggestionListItem {
  return {
    id: String(suggestion.id),
    numberLabel: `#${list.length - index}`,
    title: suggestion.title,
    openedAtLabel: formatDateLabel(suggestion.createdAt),
    authorName: suggestion.authorName,
    commentCount: suggestion.commentCount,
    status: toSuggestionListStatus(suggestion.status),
  };
}

function toSuggestionListStatus(
  status: ApiSuggestionStatus,
): SuggestionListItem["status"] {
  if (status === "OPEN") {
    return "open";
  }

  if (status === "MERGED") {
    return "merged";
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
