import { notFound } from "next/navigation";
import { getUser } from "@/features/auth/api/getUser";
import { Footer, Header } from "@/widgets/chrome/ui";
import { PostArticle } from "@/widgets/post/ui";
import {
  getPostEntry,
  contributors,
} from "@/entities/post/model";

export default async function PostPage({
  params,
}: {
  params?: Promise<{ slug?: string | string[] }>;
}) {
  const p = await params;
  const slugParam = p?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) notFound();

  const entry = getPostEntry(slug);
  if (!entry) notFound();
  const viewer = await getUser();

  const articleHref = `/posts/${slug}`;
  const suggestsHref = `${articleHref}/suggests`;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header isLoggedIn={!!viewer} />

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
