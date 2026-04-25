import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import { SuggestionDetail } from "@/widgets/post/ui";
import { getPostSuggestionDetail } from "@/entities/post/api/getPostSuggestionDetail";
import {
  type ApiSuggestionStatus,
  getPostSuggestions,
} from "@/entities/post/api/getPostSuggestions";
import { getPostDetail, type ApiPostDetail } from "@/entities/post/api/getPostDetail";
import type { Post, Suggestion } from "@/entities/post/model";
import { getUser } from "@/features/auth/api/getUser";
import { assets } from "@/shared/config/assets";
import { buildDiffRows } from "@/shared/lib/diffRows";
import {
  buildPublicPostPath,
  buildPublicSuggestsPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

export default async function PublicPostSuggestionDetailPage({
  params,
}: {
  params?: Promise<{
    username?: string;
    postSlug?: string;
    suggestionNumber?: string;
  }>;
}) {
  const resolvedParams = await params;
  const usernameParam = resolvedParams?.username;
  const postSlug = resolvedParams?.postSlug;
  const suggestionNumberParam = resolvedParams?.suggestionNumber;

  if (!usernameParam || !postSlug || !suggestionNumberParam) {
    notFound();
  }

  const authorUsername = parsePublicUsernameParam(usernameParam);
  const canonicalPostSlug = parsePublicPostSlugParam(postSlug);
  const suggestionNumber = parseSuggestionNumber(suggestionNumberParam);
  if (!authorUsername || !canonicalPostSlug || !suggestionNumber) {
    notFound();
  }

  const [viewer, detail] = await Promise.all([
    getUser(),
    getPostDetail(authorUsername, canonicalPostSlug),
  ]);

  if (!detail) {
    notFound();
  }

  const suggestions = await getPostSuggestions(detail.id);
  const summary = suggestions[suggestions.length - suggestionNumber];
  if (!summary) {
    notFound();
  }

  const suggestionDetail = await getPostSuggestionDetail(detail.id, summary.id);
  if (!suggestionDetail) {
    notFound();
  }

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const suggestsHref = buildPublicSuggestsPath(authorUsername, canonicalPostSlug);
  const post = toPost(detail);
  const suggestion = toSuggestion(
    suggestionDetail,
    suggestionNumber,
    summary.commentCount,
  );

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={viewer ? buildViewerProfileHref(viewer.username) : undefined}
      />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <SuggestionDetail
          post={post}
          suggestion={suggestion}
          articleHref={articleHref}
          suggestsHref={suggestsHref}
        />
      </main>

      <Footer />
    </div>
  );
}

function parseSuggestionNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function toPost(detail: ApiPostDetail): Post {
  return {
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
  };
}

function toSuggestion(
  detail: NonNullable<Awaited<ReturnType<typeof getPostSuggestionDetail>>>,
  displayNumber: number,
  commentCount: number,
): Suggestion {
  return {
    id: String(detail.id),
    numberLabel: `#${displayNumber}`,
    title: detail.title,
    openedAtLabel: formatDateLabel(detail.createdAt),
    authorName: detail.authorName,
    authorAvatarSrc: detail.authorProfileImageUrl ?? assets.defaultAvatar,
    commentCount,
    status: toSuggestionStatus(detail.status),
    baseVersionLabel: `v${detail.postBaseVersion}`,
    comment: {
      authorName: detail.authorName,
      authorAvatarSrc: detail.authorProfileImageUrl ?? assets.defaultAvatar,
      commentedAtLabel: formatDateLabel(detail.createdAt),
      message: detail.description,
    },
    diffRows: buildDiffRows(detail.baseContent, detail.content),
    discussionComments: [],
  };
}

function toSuggestionStatus(status: ApiSuggestionStatus): Suggestion["status"] {
  if (status === "OPEN") {
    return "open";
  }

  if (status === "OUTDATED") {
    return "outdated";
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
