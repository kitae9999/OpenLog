import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import { PostArticle } from "@/widgets/post/ui";
import { getPostComments } from "@/entities/comment/api/getPostComments";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getPostSuggestions } from "@/entities/post/api/getPostSuggestions";
import { getPostEntry, contributors } from "@/entities/post/model";
import { getUser } from "@/features/auth/api/getUser";
import { assets } from "@/shared/config/assets";
import {
  buildPublicProfilePath,
  buildPublicPostEditPath,
  buildPublicPostPath,
  buildPublicSuggestsPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";
import { MarkdownContent } from "@/shared/ui/markdown";

export default async function PublicPostPage({
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
  const profileHref = viewer
    ? buildViewerProfileHref(viewer.username)
    : undefined;

  if (detail) {
    const [commentItems, suggestions] = await Promise.all([
      getPostComments(detail.id),
      getPostSuggestions(detail.id),
    ]);
    const authorHref = buildPublicProfilePath(detail.authorUsername);
    const articleHref = buildPublicPostPath(detail.authorUsername, detail.slug);
    const editHref = buildPublicPostEditPath(
      detail.authorUsername,
      detail.slug,
    );
    const suggestsHref = buildPublicSuggestsPath(
      detail.authorUsername,
      detail.slug,
    );
    const isOwner = viewer?.username === detail.authorUsername;

    return (
      <div className="min-h-dvh bg-white text-zinc-950">
        <Header
          isLoggedIn={!!viewer}
          profileImageUrl={viewer?.profileImageUrl}
          profileHref={profileHref}
        />

        <main className="mx-auto w-full max-w-[1083px] pb-16 pt-6 sm:px-8">
          <PostArticle
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
              comments: commentItems.length,
            }}
            commentItems={commentItems}
            postId={detail.id}
            ownerActions={
              isOwner
                ? {
                    postId: detail.id,
                    editHref,
                    profileHref: authorHref,
                  }
                : undefined
            }
            authorHref={authorHref}
            currentUserAvatarSrc={viewer?.profileImageUrl}
            backHref="/?tab=trending"
            articleHref={articleHref}
            suggestsHref={suggestsHref}
            suggestCount={suggestions.length}
          >
            <div className="mt-8 space-y-6 text-[16px] leading-8 text-zinc-700">
              <MarkdownContent markdown={detail.content} />
            </div>
          </PostArticle>
        </main>

        <Footer />
      </div>
    );
  }

  const entry = getPostEntry(authorUsername, canonicalPostSlug);
  if (!entry) {
    notFound();
  }

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const authorHref = buildPublicProfilePath(authorUsername);
  const suggestsHref = buildPublicSuggestsPath(
    authorUsername,
    canonicalPostSlug,
  );

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={profileHref}
      />

      <main className="mx-auto w-full max-w-[1083px] pb-16 pt-6 sm:px-8">
        <PostArticle
          post={entry.post}
          contributors={contributors}
          authorHref={authorHref}
          currentUserAvatarSrc={viewer?.profileImageUrl}
          backHref="/?tab=trending"
          articleHref={articleHref}
          suggestsHref={suggestsHref}
          suggestCount={entry.suggestCount}
        >
          {entry.body}
        </PostArticle>
      </main>

      <Footer />
    </div>
  );
}
