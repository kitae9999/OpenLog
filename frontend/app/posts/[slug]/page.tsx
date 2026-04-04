import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { Footer, Header } from "@/widgets/chrome/ui";
import { PostArticle } from "@/widgets/post/ui";
import {
  getPostEntry,
  contributors,
} from "@/entities/post/model";
import { assets } from "@/shared/config/assets";
import { MarkdownContent } from "@/shared/ui/markdown";

export default async function PostPage({
  params,
}: {
  params?: Promise<{ slug?: string | string[] }>;
}) {
  const p = await params;
  const slugParam = p?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) notFound();
  const viewer = await getUserOrRedirectToOnboarding();
  const headerStore = await headers();

  if (/^\d+$/.test(slug)) {
    const detail = await getPostDetail(Number(slug), headerStore.get("cookie") ?? "");
    if (!detail) notFound();

    return (
      <div className="min-h-dvh bg-white text-zinc-950">
        <Header
          isLoggedIn={!!viewer}
          profileImageUrl={viewer?.profileImageUrl}
        />

        <main className="mx-auto w-full max-w-[1083px] pb-16 pt-6 sm:px-8">
          <PostArticle
            post={{
              title: detail.title,
              description: detail.description,
              authorName: detail.authorName,
              authorAvatarSrc: detail.authorAvatarSrc ?? assets.defaultAvatar,
              publishedAtLabel: detail.publishedAtLabel,
              readTimeLabel: detail.readTimeLabel,
              tags: detail.topics,
              coverSrc: assets.postCover,
              likes: detail.likes,
              comments: detail.comments,
            }}
            backHref="/?tab=trending"
            articleHref={`/posts/${detail.id}`}
            suggestsHref={`/posts/${detail.id}/suggests`}
            suggestEditsHref="/contribute"
            suggestCount={0}
            showSuggestsTab={false}
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

  const entry = getPostEntry(slug);
  if (!entry) notFound();

  const articleHref = `/posts/${slug}`;
  const suggestsHref = `${articleHref}/suggests`;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
      />

      <main className="mx-auto w-full max-w-[1083px] pb-16 pt-6 sm:px-8">
        <PostArticle
          post={entry.post}
          contributors={contributors}
          backHref="/?tab=trending"
          articleHref={articleHref}
          suggestsHref={suggestsHref}
          suggestEditsHref="/contribute"
          suggestCount={entry.suggestCount}
        >
          {entry.body}
        </PostArticle>
      </main>

      <Footer />
    </div>
  );
}
