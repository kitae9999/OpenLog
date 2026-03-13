import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import { PostArticle } from "@/widgets/post/ui";
import {
  getOpenLogPostEntry,
  openLogContributors,
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

  const entry = getOpenLogPostEntry(slug);
  if (!entry) notFound();

  const articleHref = `/posts/${slug}`;
  const suggestsHref = `${articleHref}/suggests`;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header />

      <main className="mx-auto w-full max-w-[1083px] pb-16 pt-6 sm:px-8">
        <PostArticle
          post={entry.post}
          contributors={openLogContributors}
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
